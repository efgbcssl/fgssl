/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useCallback, SetStateAction } from 'react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Loader2, FileAudio, FileText, Search, Youtube } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { formatBytes, formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Image from "next/image"

interface YouTubeMetadata {
    description?: string;
    privacyStatus: 'public' | 'unlisted' | 'private';
    tags?: string[];
    thumbnail?: File | null;
}

interface Resource {
    fileId: string;
    name: string;
    type: 'audio' | 'pdf' | 'video';
    url: string;
    downloadable?: boolean;
    uploadedAt: string;
    size: number;
    youtubeId?: string;
    youtubeMetadata?: YouTubeMetadata;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_FILE_TYPES = {
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    pdf: ['application/pdf'],
    video: ['video/mp4', 'video/quicktime', 'video/x-msvideo']
};

export default function AdminResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tab, setTab] = useState<'audio' | 'pdf'>('audio');
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [downloadable, setDownloadable] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [privacyStatus, setPrivacyStatus] = useState<'public' | 'unlisted' | 'private'>('unlisted');
    const [tags, setTags] = useState('');
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const { toast } = useToast();

    const pageSize = 6;

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on search
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const fetchResources = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/dashboard/resources/imagekit?type=${tab}`);
            if (!res.ok) throw new Error('Failed to fetch resources');
            const data = await res.json();
            setResources(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to fetch resources',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    }, [tab, toast]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);


    const filtered = resources.filter(r =>
        r.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

    const handleDelete = async (fileId: string) => {
        setIsDeleting(fileId);
        try {
            const res = await fetch(`/api/dashboard/resources/imagekit`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileId })
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            toast({
                title: 'Success',
                description: 'Resource deleted successfully',
                variant: 'default'
            });
            await fetchResources();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Delete failed',
                variant: 'destructive'
            });
        } finally {
            setIsDeleting(null);
        }
    };

    const validateFile = (file: File): string | null => {
        if (tab !== 'video') {
            const maxSize = MAX_FILE_SIZE; // 50MB for audio and PDF
            if (file.size > maxSize) {
                return `File size exceeds ${formatBytes(maxSize)} limit`;
            }
        }
        const acceptedTypes = ACCEPTED_FILE_TYPES[tab];
        if (!acceptedTypes.includes(file.type)) {
            return `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`;
        }

        return null;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const validationError = validateFile(selectedFile);
        if (validationError) {
            toast({
                title: 'Invalid File',
                description: validationError,
                variant: 'destructive'
            });
            e.target.value = ''; // Reset file input
            return;
        }

        setFile(selectedFile);

        const sizeInfo = tab === 'video'
            ? `${formatBytes(selectedFile.size)} (no size limit)`
            : `${formatBytes(selectedFile.size)} (max ${formatBytes(50 * 1024 * 1024)})`;
        // Auto-fill title with filename (without extension) if title is empty
        if (!title) {
            const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
            setTitle(fileNameWithoutExt);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast({
                title: 'Missing File',
                description: 'Please select a file to upload',
                variant: 'destructive'
            });
            return;
        }

        if (!title.trim()) {
            toast({
                title: 'Missing Title',
                description: 'Please enter a title for the resource',
                variant: 'destructive'
            });
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('type', tab);
        formData.append('downloadable', String(downloadable));

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/dashboard/resources/imagekit');

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percent);
                }
            };

            await new Promise((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        resolve(xhr.response);
                    } else {
                        reject(xhr.responseText);
                    }
                };

                xhr.onerror = () => {
                    reject(new Error('Network error during upload'));
                };

                xhr.send(formData);
            });

            toast({
                title: 'Upload Successful',
                description: `${file.name} has been uploaded successfully`,
                variant: 'default'
            });

            // Reset form
            setTitle('');
            setFile(null);
            setDownloadable(true);
            // Refresh resources
            await fetchResources();
        } catch (error) {
            let errorMessage = 'Upload failed';
            if (typeof error === 'string') {
                try {
                    const errData = JSON.parse(error);
                    errorMessage = errData?.error || error;
                } catch {
                    errorMessage = error;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast({
                title: 'Upload Failed',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleYoutubeUpload = async () => {
        if (!file) {
            toast({
                title: 'Missing File',
                description: 'Please select a video file to upload',
                variant: 'destructive'
            });
            return;
        }

        if (!title.trim()) {
            toast({
                title: 'Missing Title',
                description: 'Please enter a title for the video',
                variant: 'destructive'
            });
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // Create form data with all video metadata
            const formData = new FormData();
            formData.append('video', file);
            formData.append('title', title);
            formData.append('description', description);
            formData.append('tags', tags);
            formData.append('privacyStatus', privacyStatus);
            formData.append('downloadable', String(downloadable));

            // Append thumbnail if provided
            if (thumbnail) {
                formData.append('thumbnail', thumbnail);
            }

            // Upload using fetch API with progress tracking
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/dashboard/resources/youtube');

            // Track upload progress
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percent);
                }
            };

            const uploadPromise = new Promise((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(xhr.response);
                    } else {
                        reject(xhr.responseText || 'Upload failed');
                    }
                };

                xhr.onerror = () => {
                    reject(new Error('Network error during upload'));
                };

                xhr.onabort = () => {
                    reject(new Error('Upload cancelled'));
                };

                xhr.send(formData);
            });

            const responseText = await uploadPromise;
            const response = JSON.parse(responseText);

            if (response.error) {
                throw new Error(response.error);
            }

            toast({
                title: 'Upload Successful',
                description: `Video "${title}" has been uploaded to YouTube`,
                variant: 'default',
                action: response.videoId ? {
                    label: 'View on YouTube',
                    onClick: () => window.open(`https://youtu.be/${response.videoId}`, '_blank')
                } : undefined
            });

            // Reset form
            setTitle('');
            setDescription('');
            setTags('');
            setFile(null);
            setThumbnail(null);
            setPrivacyStatus('unlisted');

            // Refresh resources list
            await fetchResources();

        } catch (error) {
            let errorMessage = 'Failed to upload video';

            if (error instanceof Error) {
                errorMessage = error.message;

                // Handle specific error cases
                if (error.message.includes('401')) {
                    errorMessage = 'Authentication expired - please reconnect your YouTube account';
                } else if (error.message.includes('quota')) {
                    errorMessage = 'YouTube quota exceeded - try again later';
                }
            }

            toast({
                title: 'Upload Failed',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Manage Resources</h1>

            <Tabs defaultValue="audio" value={tab} onValueChange={val => setTab(val as 'audio' | 'pdf')}>
                <TabsList>
                    <TabsTrigger value="audio" className="flex items-center gap-2">
                        <FileAudio className="w-4 h-4" /> Audio
                    </TabsTrigger>
                    <TabsTrigger value="pdf" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" /> PDF
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-2">
                        <Youtube className="w-4 h-4" /> Video
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="audio" className="mt-6">
                    <div className="space-y-4">
                        <div>
                            <Label>Title *</Label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="My Audio Resource"
                            />
                        </div>

                        <div>
                            <Label>Audio File *</Label>
                            <Input
                                type="file"
                                onChange={handleFileChange}
                                accept={ACCEPTED_FILE_TYPES.audio.join(',')}
                            />
                            {file && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                    Selected: {file.name} ({formatBytes(file.size)} of max {formatBytes(50 * 1024 * 1024)})
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                id="downloadable"
                                checked={downloadable}
                                onCheckedChange={setDownloadable}
                            />
                            <Label htmlFor="downloadable">Allow downloads</Label>
                        </div>

                        <Button
                            onClick={handleUpload}
                            className="mt-2"
                            disabled={uploading || !file || !title.trim()}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading... ({uploadProgress}%)
                                </>
                            ) : 'Upload Audio'}
                        </Button>

                        {uploading && (
                            <Progress value={uploadProgress} className="h-2" />
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="pdf" className="mt-6">
                    <div className="space-y-4">
                        <div>
                            <Label>Title *</Label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="My PDF Resource"
                            />
                        </div>

                        <div>
                            <Label>PDF File *</Label>
                            <Input
                                type="file"
                                onChange={handleFileChange}
                                accept={ACCEPTED_FILE_TYPES.pdf.join(',')}
                            />
                            {file && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                    Selected: {file.name} ({formatBytes(file.size)} of max {formatBytes(50 * 1024 * 1024)})
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                id="downloadable"
                                checked={downloadable}
                                onCheckedChange={setDownloadable}
                            />
                            <Label htmlFor="downloadable">Allow downloads</Label>
                        </div>

                        <Button
                            onClick={handleUpload}
                            className="mt-2"
                            disabled={uploading || !file || !title.trim()}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading... ({uploadProgress}%)
                                </>
                            ) : 'Upload PDF'}
                        </Button>

                        {uploading && (
                            <Progress value={uploadProgress} className="h-2" />
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="video" className="mt-6">
                    <div className="space-y-4">
                        <div>
                            <Label>Title *</Label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="My Video Resource"
                            />
                        </div>

                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e: { target: { value: SetStateAction<string>; }; }) => setDescription(e.target.value)}
                                placeholder="Video description..."
                                rows={4}
                            />
                        </div>
                        <div>
                            <Label>Tags (comma separated)</Label>
                            <Input
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                                placeholder="tag1, tag2, tag3"
                            />
                        </div>

                        <div>
                            <div className="space-y-2 m-4">
                                <Label className="text-base font-medium">Privacy Status</Label>
                                <RadioGroup
                                    value={privacyStatus}
                                    onValueChange={(value) => setPrivacyStatus(value as "public" | "unlisted" | "private")}
                                    className="flex gap-6 mt-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem id="public" value="public" />
                                        <Label htmlFor="public">Public</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem id="unlisted" value="unlisted" />
                                        <Label htmlFor="unlisted">Unlisted</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem id="private" value="private" />
                                        <Label htmlFor="private">Private</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div>
                                <Label>Video File *</Label>
                                <div className="flex flex-col gap-4">
                                    <div className="border rounded-lg p-4">
                                        <h3 className="font-medium mb-2">Upload to YouTube</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Videos will be uploaded to your YouTube account
                                        </p>
                                        <Input
                                            type="file"
                                            onChange={handleFileChange}
                                            accept={ACCEPTED_FILE_TYPES.video.join(',')}
                                        />
                                        {file && (
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                Selected: {file.name} ({formatBytes(file.size)})
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <Label>Custom Thumbnail (Optional)</Label>
                                    <div className="border rounded-lg p-4">
                                        <Input
                                            type="file"
                                            onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                                            accept="image/jpeg,image/png"
                                        />
                                        {thumbnail && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <Image
                                                    src={URL.createObjectURL(thumbnail)}
                                                    alt="Thumbnail preview"
                                                    fill
                                                    className="object-cover rounded"
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                    {thumbnail.name} ({formatBytes(thumbnail.size)})
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    id="downloadable"
                                    checked={downloadable}
                                    onCheckedChange={setDownloadable}
                                />
                                <Label htmlFor="downloadable">Allow downloads (if available)</Label>
                            </div>

                            <Button
                                onClick={handleYoutubeUpload}
                                className="mt-2"
                                disabled={uploading || !file || !title.trim()}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading to YouTube... ({uploadProgress}%)
                                    </>
                                ) : 'Upload Video'}
                            </Button>

                            {uploading && (
                                <Progress value={uploadProgress} className="h-2" />
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="my-8">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search resources..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            ) : paginated.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {debouncedSearch
                            ? 'No resources match your search'
                            : 'No resources found. Upload one to get started!'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {paginated.map((resource) => (
                            <div key={resource.fileId} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2 flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{resource.name}</h3>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>{formatBytes(resource.size)}</span>
                                            <span>•</span>
                                            <span>{formatDate(resource.uploadedAt)}</span>
                                            <span>•</span>
                                            <span>{resource.downloadable ? 'Downloadable' : 'View only'}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDelete(resource.fileId)}
                                        disabled={isDeleting === resource.fileId}
                                    >
                                        {isDeleting === resource.fileId ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>

                                <div className="mt-4">
                                    {resource.type === 'audio' ? (
                                        <audio
                                            controls
                                            src={resource.url}
                                            className="w-full mt-2 rounded-lg"
                                        />
                                    ) : (
                                        <div className="border rounded-lg overflow-hidden">
                                            <iframe
                                                src={`https://docs.google.com/gview?url=${encodeURIComponent(resource.url)}&embedded=true`}
                                                className="w-full h-64"
                                                title={resource.name}
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {pageCount > 1 && (
                        <Pagination className="mt-8">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setPage(p => Math.max(p - 1, 1))}

                                    />
                                </PaginationItem>
                                <PaginationItem>
                                    <span className="text-sm">
                                        Page {page} of {pageCount}
                                    </span>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setPage(p => Math.min(p + 1, pageCount))}

                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </>
            )}
        </div>
    );
}
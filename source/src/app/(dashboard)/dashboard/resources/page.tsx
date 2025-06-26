"use client";

import { useEffect, useState, useCallback } from 'react';
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
import { Trash2, Loader2, FileAudio, FileText, Search } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { formatBytes, formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface Resource {
    fileId: string;
    name: string;
    type: 'audio' | 'pdf';
    url: string;
    downloadable?: boolean;
    uploadedAt: string;
    size: number;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_FILE_TYPES = {
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    pdf: ['application/pdf']
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
    const { toast } = useToast();

    const pageSize = 5;

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
        if (file.size > MAX_FILE_SIZE) {
            return `File size exceeds ${formatBytes(MAX_FILE_SIZE)} limit`;
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
                                    Selected: {file.name} ({formatBytes(file.size)})
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
                                    Selected: {file.name} ({formatBytes(file.size)})
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
                                        disabled={page === 1}
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
                                        disabled={page === pageCount}
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
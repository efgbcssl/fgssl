/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useMemo, useState, useCallback, SetStateAction } from 'react';
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
import {
    Trash2,
    Loader2,
    FileAudio,
    FileText,
    Search,
    Youtube,
    Upload,
    Eye,
    Music,
    Video,
    Files,
    Tag as TagIcon,
    Sparkles,
    Pencil,
    Link as LinkIcon,
} from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { formatBytes, formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import { ToastAction } from "@/components/ui/toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// ===== Types =====
export type ResourceType = 'audio' | 'pdf' | 'document' | 'video';

export interface YouTubeMetadata {
    description?: string;
    privacyStatus: 'public' | 'unlisted' | 'private';
    tags?: string[];
    thumbnailUrl?: string | null;
}

export interface AdminResource {
    _id: string; // MongoDB id
    fileId?: string; // ImageKit file id (non-video)
    name: string;
    type: ResourceType;
    url?: string; // ImageKit URL (non-video)
    downloadable?: boolean;
    uploadedAt: string; // ISO date
    size?: number;
    youtubeId?: string; // for videos
    youtubeMetadata?: YouTubeMetadata;
    featured?: boolean;
    category?: 'sermons' | 'studies' | 'events' | 'music' | 'other';
    tags?: string[];
    description?: string;
}

export interface ResourceStats {
    totalResources: number;
    totalSize: number;
    resourcesByType: Record<ResourceType, number>;
    recentUploads: AdminResource[];
    popularResources: AdminResource[]; // currently by featured=true
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB for audio/pdf/doc

const ACCEPTED_FILE_TYPES: Record<ResourceType, string[]> = {
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    pdf: ['application/pdf'],
    document: [
        'text/plain',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    video: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
};

// Helpers for previews
const isOfficeDoc = (mime?: string) => !!mime && [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
].includes(mime);

const isCsvOrTxt = (mime?: string) => !!mime && (mime.startsWith('text/plain') || mime.startsWith('text/csv'));

const officeViewerUrl = (publicUrl: string) => `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicUrl)}`;
const googleViewerUrl = (publicUrl: string) => `https://docs.google.com/gview?url=${encodeURIComponent(publicUrl)}&embedded=true`;

export default function AdminResourcesPage() {
    const [resources, setResources] = useState<AdminResource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tab, setTab] = useState<ResourceType>('audio');
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
    const [tagsInput, setTagsInput] = useState('');
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [category, setCategory] = useState<'sermons' | 'studies' | 'events' | 'music' | 'other'>('sermons');
    const [featured, setFeatured] = useState(false);
    const [stats, setStats] = useState<ResourceStats | null>(null);
    const [editing, setEditing] = useState<AdminResource | null>(null);

    const { toast } = useToast();
    const pageSize = 8;

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchResources = useCallback(async () => {
        setIsLoading(true);
        try {
            // Unified API for all types (backed by MongoDB). You will implement this.
            const [audioRes, pdfRes, docRes, videoRes] = await Promise.all([
                fetch('/api/dashboard/resources?type=audio'),
                fetch('/api/dashboard/resources?type=pdf'),
                fetch('/api/dashboard/resources?type=document'),
                fetch('/api/dashboard/resources?type=video'),
            ]);

            const [audio, pdf, doc, video] = await Promise.all([
                audioRes.ok ? audioRes.json() : [],
                pdfRes.ok ? pdfRes.json() : [],
                docRes.ok ? docRes.json() : [],
                videoRes.ok ? videoRes.json() : [],
            ]);

            const all: AdminResource[] = [...audio, ...pdf, ...doc, ...video];
            const current = all.filter(r => r.type === tab);

            // compute stats client-side (works even without a stats API)
            const totalSize = all.reduce((acc, r) => acc + (r.size || 0), 0);
            const resourcesByType: Record<ResourceType, number> = {
                audio: all.filter(r => r.type === 'audio').length,
                pdf: all.filter(r => r.type === 'pdf').length,
                document: all.filter(r => r.type === 'document').length,
                video: all.filter(r => r.type === 'video').length,
            };
            const recentUploads = [...all].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()).slice(0, 5);
            const popularResources = all.filter(r => r.featured).slice(0, 5);

            setResources(current);
            setStats({ totalResources: all.length, totalSize, resourcesByType, recentUploads, popularResources });
        } catch (error) {
            toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to fetch resources', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [tab, toast]);

    useEffect(() => { fetchResources(); }, [fetchResources]);

    const filtered = useMemo(() => {
        const s = debouncedSearch.trim().toLowerCase();
        if (!s) return resources;
        return resources.filter(r =>
            r.name.toLowerCase().includes(s) ||
            (r.description?.toLowerCase().includes(s)) ||
            (r.tags?.some(t => t.toLowerCase().includes(s)))
        );
    }, [resources, debouncedSearch]);

    const paginated = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

    const validateFile = (file: File): string | null => {
        if (tab !== 'video' && file.size > MAX_FILE_SIZE_BYTES) {
            return `File size exceeds ${formatBytes(MAX_FILE_SIZE_BYTES)} limit`;
        }
        const accepted = ACCEPTED_FILE_TYPES[tab];
        if (!accepted.includes(file.type)) {
            return `Invalid file type for ${tab}. Accepted: ${accepted.join(', ')}`;
        }
        return null;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        const err = validateFile(selected);
        if (err) {
            toast({ title: 'Invalid File', description: err, variant: 'destructive' });
            e.target.value = '';
            return;
        }
        setFile(selected);
        if (!title) {
            const base = selected.name.replace(/\.[^/.]+$/, "");
            setTitle(base);
        }
    };

    const resetForm = () => {
        setTitle('');
        setFile(null);
        setDownloadable(true);
        setDescription('');
        setTagsInput('');
        setCategory('sermons');
        setFeatured(false);
        setThumbnail(null);
        setPrivacyStatus('unlisted');
        setUploadProgress(0);
    };

    // Unified uploader for non-video (ImageKit)
    const handleUploadResource = async () => {
        if (!file) return toast({ title: 'Missing File', description: 'Please select a file to upload', variant: 'destructive' });
        if (!title.trim()) return toast({ title: 'Missing Title', description: 'Please enter a title', variant: 'destructive' });

        setUploading(true);
        setUploadProgress(0);

        const form = new FormData();
        form.append('file', file);
        form.append('title', title);
        form.append('type', tab); // 'audio' | 'pdf' | 'document'
        form.append('downloadable', String(downloadable));
        form.append('category', category);
        form.append('featured', String(featured));
        form.append('description', description);
        form.append('tags', tagsInput);

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/dashboard/resources/imagekit');
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
            };
            const responseText: string = await new Promise((resolve, reject) => {
                xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve(xhr.responseText) : reject(xhr.responseText || 'Upload failed');
                xhr.onerror = () => reject('Network error during upload');
                xhr.send(form);
            });

            const response = JSON.parse(responseText);
            if (!response || response.error) throw new Error(response?.error || 'Upload failed');

            toast({ title: 'Upload Successful', description: `${file.name} has been uploaded`, variant: 'default' });
            resetForm();
            await fetchResources();
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            toast({ title: 'Upload Failed', description: msg, variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    // YouTube uploader for videos
    const handleYoutubeUpload = async () => {
        if (!file) return toast({ title: 'Missing File', description: 'Select a video file', variant: 'destructive' });
        if (!title.trim()) return toast({ title: 'Missing Title', description: 'Enter a title', variant: 'destructive' });

        setUploading(true);
        setUploadProgress(0);

        try {
            const form = new FormData();
            form.append('video', file);
            form.append('title', title);
            form.append('description', description);
            form.append('tags', tagsInput);
            form.append('privacyStatus', privacyStatus);
            form.append('downloadable', String(downloadable));
            form.append('category', category);
            form.append('featured', String(featured));
            if (thumbnail) form.append('thumbnail', thumbnail);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/dashboard/resources/youtube');
            xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)); };
            const responseText: string = await new Promise((resolve, reject) => {
                xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve(xhr.responseText) : reject(xhr.responseText || 'Upload failed');
                xhr.onerror = () => reject('Network error during upload');
                xhr.send(form);
            });

            const response = JSON.parse(responseText);
            if (response.error) throw new Error(response.error);

            toast({
                title: 'YouTube Upload Successful',
                description: `Video "${title}" uploaded`,
                action: response.videoId ? (
                    <ToastAction altText="View" onClick={() => window.open(`https://youtu.be/${response.videoId}`, '_blank')}>
                        View on YouTube
                    </ToastAction>
                ) : undefined,
            });

            resetForm();
            await fetchResources();
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            toast({ title: 'Upload Failed', description: msg.includes('401') ? 'YouTube auth expired — reconnect.' : msg, variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            const res = await fetch(`/api/dashboard/resources/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());
            toast({ title: 'Deleted', description: 'Resource removed', variant: 'default' });
            await fetchResources();
        } catch (error) {
            toast({ title: 'Error', description: error instanceof Error ? error.message : 'Delete failed', variant: 'destructive' });
        } finally {
            setIsDeleting(null);
        }
    };

    const openEdit = (r: AdminResource) => setEditing(r);
    const closeEdit = () => setEditing(null);

    const [savingEdit, setSavingEdit] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editTags, setEditTags] = useState('');
    const [editCategory, setEditCategory] = useState<'sermons' | 'studies' | 'events' | 'music' | 'other'>('sermons');
    const [editFeatured, setEditFeatured] = useState(false);
    const [editDownloadable, setEditDownloadable] = useState(true);

    useEffect(() => {
        if (!editing) return;
        setEditTitle(editing.name || '');
        setEditDescription(editing.description || '');
        setEditTags((editing.tags || []).join(', '));
        setEditCategory(editing.category || 'other');
        setEditFeatured(!!editing.featured);
        setEditDownloadable(!!editing.downloadable);
    }, [editing]);

    const saveEdit = async () => {
        if (!editing) return;
        setSavingEdit(true);
        try {
            const res = await fetch(`/api/dashboard/resources/${editing._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editTitle.trim(),
                    description: editDescription.trim(),
                    tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
                    category: editCategory,
                    featured: editFeatured,
                    downloadable: editDownloadable,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast({ title: 'Saved', description: 'Resource updated', variant: 'default' });
            closeEdit();
            await fetchResources();
        } catch (err) {
            toast({ title: 'Update failed', description: err instanceof Error ? err.message : 'Unable to update', variant: 'destructive' });
        } finally {
            setSavingEdit(false);
        }
    };

    // ===== Render =====
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Resource Management</h1>
                    <p className="text-gray-600">Upload and manage your multimedia content</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => window.location.href = '/resources'}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Site
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
                            <Files className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalResources}</div>
                            <p className="text-xs text-muted-foreground">{formatBytes(stats.totalSize)} total size</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Videos</CardTitle>
                            <Video className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.resourcesByType.video}</div>
                            <p className="text-xs text-muted-foreground">YouTube uploads</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Audio Files</CardTitle>
                            <Music className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.resourcesByType.audio}</div>
                            <p className="text-xs text-muted-foreground">Sermons & music</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Documents</CardTitle>
                            <FileText className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.resourcesByType.pdf + stats.resourcesByType.document}</div>
                            <p className="text-xs text-muted-foreground">PDFs, Word, Excel, CSV</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="audio" value={tab} onValueChange={(v) => setTab(v as ResourceType)}>
                <TabsList>
                    <TabsTrigger value="audio" className="flex items-center gap-2"><FileAudio className="w-4 h-4" /> Audio</TabsTrigger>
                    <TabsTrigger value="pdf" className="flex items-center gap-2"><FileText className="w-4 h-4" /> PDF</TabsTrigger>
                    <TabsTrigger value="document" className="flex items-center gap-2"><Files className="w-4 h-4" /> Documents</TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-2"><Youtube className="w-4 h-4" /> Video</TabsTrigger>
                </TabsList>

                {/* AUDIO */}
                <TabsContent value="audio" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Music className="h-5 w-5 text-blue-500" />Upload Audio File</CardTitle>
                            <CardDescription>Upload audio files like sermons, music, or podcasts</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Title *</Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Sunday Service - Week 1" />
                                </div>
                                <div>
                                    <Label>Category *</Label>
                                    <Select value={category} onValueChange={setCategory as any}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sermons">Sermons</SelectItem>
                                            <SelectItem value="music">Music</SelectItem>
                                            <SelectItem value="studies">Bible Studies</SelectItem>
                                            <SelectItem value="events">Events</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label>Description</Label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the audio content..." rows={3} />
                            </div>

                            <div>
                                <Label>Tags (comma separated)</Label>
                                <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="worship, sermon, sunday, faith" />
                            </div>

                            <div>
                                <Label>Audio File *</Label>
                                <Input type="file" onChange={handleFileChange} accept={ACCEPTED_FILE_TYPES.audio.join(',')} />
                                {file && <div className="mt-2 text-sm text-muted-foreground">Selected: {file.name} ({formatBytes(file.size)} of max {formatBytes(MAX_FILE_SIZE_BYTES)})</div>}
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Switch id="downloadable" checked={downloadable} onCheckedChange={setDownloadable} />
                                    <Label htmlFor="downloadable">Allow downloads</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
                                    <Label htmlFor="featured">Mark as featured</Label>
                                </div>
                            </div>

                            <Button onClick={handleUploadResource} className="w-full" disabled={uploading || !file || !title.trim()}>
                                {uploading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading... ({uploadProgress}%)</>) : (<><Upload className="w-4 h-4 mr-2" />Upload Audio</>)}
                            </Button>
                            {uploading && (<Progress value={uploadProgress} className="h-2" />)}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PDF */}
                <TabsContent value="pdf" className="mt-6">
                    <div className="space-y-4">
                        <div>
                            <Label>Title *</Label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="My PDF Resource" />
                        </div>
                        <div>
                            <Label>PDF File *</Label>
                            <Input type="file" onChange={handleFileChange} accept={ACCEPTED_FILE_TYPES.pdf.join(',')} />
                            {file && <div className="mt-2 text-sm text-muted-foreground">Selected: {file.name} ({formatBytes(file.size)} of max {formatBytes(MAX_FILE_SIZE_BYTES)})</div>}
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch id="downloadable-pdf" checked={downloadable} onCheckedChange={setDownloadable} />
                            <Label htmlFor="downloadable-pdf">Allow downloads</Label>
                        </div>
                        <Button onClick={handleUploadResource} className="mt-2" disabled={uploading || !file || !title.trim()}>
                            {uploading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading... ({uploadProgress}%)</>) : 'Upload PDF'}
                        </Button>
                        {uploading && (<Progress value={uploadProgress} className="h-2" />)}
                    </div>
                </TabsContent>

                {/* DOCUMENTS (Word/Excel/CSV/TXT/PPT) */}
                <TabsContent value="document" className="mt-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Title *</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Document Resource" />
                            </div>
                            <div>
                                <Label>Category *</Label>
                                <Select value={category} onValueChange={setCategory as any}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sermons">Sermons</SelectItem>
                                        <SelectItem value="studies">Bible Studies</SelectItem>
                                        <SelectItem value="events">Events</SelectItem>
                                        <SelectItem value="music">Music</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Description</Label>
                            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." rows={3} />
                        </div>

                        <div>
                            <Label>Tags (comma separated)</Label>
                            <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="outline, worksheet, csv" />
                        </div>

                        <div>
                            <Label>Document File *</Label>
                            <Input type="file" onChange={handleFileChange} accept={ACCEPTED_FILE_TYPES.document.join(',')} />
                            {file && <div className="mt-2 text-sm text-muted-foreground">Selected: {file.name} ({formatBytes(file.size)} of max {formatBytes(MAX_FILE_SIZE_BYTES)})</div>}
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Switch id="downloadable-doc" checked={downloadable} onCheckedChange={setDownloadable} />
                                <Label htmlFor="downloadable-doc">Allow downloads</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch id="featured-doc" checked={featured} onCheckedChange={setFeatured} />
                                <Label htmlFor="featured-doc">Mark as featured</Label>
                            </div>
                        </div>

                        <Button onClick={handleUploadResource} className="w-full" disabled={uploading || !file || !title.trim()}>
                            {uploading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading... ({uploadProgress}%)</>) : (<><Upload className="w-4 h-4 mr-2" />Upload Document</>)}
                        </Button>
                        {uploading && (<Progress value={uploadProgress} className="h-2" />)}
                    </div>
                </TabsContent>

                {/* VIDEO */}
                <TabsContent value="video" className="mt-6">
                    <div className="space-y-4">
                        <div>
                            <Label>Title *</Label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Video Resource" />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Video description..." rows={4} />
                        </div>
                        <div>
                            <Label>Tags (comma separated)</Label>
                            <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="tag1, tag2, tag3" />
                        </div>

                        <div className="space-y-2 m-4">
                            <Label className="text-base font-medium">Privacy Status</Label>
                            <RadioGroup value={privacyStatus} onValueChange={(v) => setPrivacyStatus(v as 'public' | 'unlisted' | 'private')} className="flex gap-6 mt-2">
                                <div className="flex items-center space-x-2"><RadioGroupItem id="public" value="public" /><Label htmlFor="public">Public</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem id="unlisted" value="unlisted" /><Label htmlFor="unlisted">Unlisted</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem id="private" value="private" /><Label htmlFor="private">Private</Label></div>
                            </RadioGroup>
                        </div>

                        <div>
                            <Label>Video File *</Label>
                            <div className="border rounded-lg p-4">
                                <p className="text-sm text-muted-foreground mb-4">Videos will be uploaded to your YouTube account</p>
                                <Input type="file" onChange={handleFileChange} accept={ACCEPTED_FILE_TYPES.video.join(',')} />
                                {file && <div className="mt-2 text-sm text-muted-foreground">Selected: {file.name} ({formatBytes(file.size)})</div>}
                            </div>
                        </div>

                        <div>
                            <Label>Custom Thumbnail (Optional)</Label>
                            <div className="border rounded-lg p-4">
                                <Input type="file" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} accept="image/jpeg,image/png" />
                                {thumbnail && (
                                    <div className="mt-2 flex items-center gap-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={URL.createObjectURL(thumbnail)} alt="Thumbnail preview" className="w-28 h-16 object-cover rounded" />
                                        <span className="text-sm text-muted-foreground">{thumbnail.name} ({formatBytes(thumbnail.size)})</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch id="downloadable-video" checked={downloadable} onCheckedChange={setDownloadable} />
                            <Label htmlFor="downloadable-video">Allow downloads (if available)</Label>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch id="featured-video" checked={featured} onCheckedChange={setFeatured} />
                            <Label htmlFor="featured-video">Mark as featured</Label>
                        </div>

                        <Button onClick={handleYoutubeUpload} className="mt-2" disabled={uploading || !file || !title.trim()}>
                            {uploading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading to YouTube... ({uploadProgress}%)</>) : 'Upload Video'}
                        </Button>
                        {uploading && (<Progress value={uploadProgress} className="h-2" />)}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Search */}
            <div className="my-8">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-4">{[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-32 w-full" />))}</div>
            ) : paginated.length === 0 ? (
                <div className="text-center py-12"><p className="text-muted-foreground">{debouncedSearch ? 'No resources match your search' : 'No resources found. Upload one to get started!'}</p></div>
            ) : (
                <>
                    <div className="space-y-4">
                        {paginated.map((r) => (
                            <div key={r._id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-2 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {r.featured && <Badge className="bg-amber-500/15 text-amber-600"><Sparkles className="w-3 h-3 mr-1" />Featured</Badge>}
                                            <Badge variant="secondary" className="capitalize">{r.type}</Badge>
                                            {r.category && <Badge variant="outline" className="capitalize">{r.category}</Badge>}
                                        </div>
                                        <h3 className="font-semibold truncate flex items-center gap-2">
                                            {r.name}
                                            {r.youtubeId && (
                                                <Button size="icon" variant="ghost" onClick={() => window.open(`https://youtu.be/${r.youtubeId}`, '_blank')} title="Open on YouTube">
                                                    <LinkIcon className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                            {typeof r.size === 'number' && <span>{formatBytes(r.size)}</span>}
                                            <span>•</span>
                                            <span>{formatDate(r.uploadedAt)}</span>
                                            <span>•</span>
                                            <span>{r.downloadable ? 'Downloadable' : 'View only'}</span>
                                        </div>
                                        {r.tags && r.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-1">{r.tags.map((t, i) => <Badge key={i} variant="secondary" className="flex items-center gap-1"><TagIcon className="w-3 h-3" />{t}</Badge>)}</div>
                                        )}
                                        {r.description && <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" onClick={() => openEdit(r)} title="Edit">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => handleDelete(r._id)} disabled={isDeleting === r._id} title="Delete">
                                            {isDeleting === r._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="mt-4">
                                    {r.type === 'audio' && r.url && (
                                        <audio controls src={r.url} className="w-full mt-2 rounded-lg" />
                                    )}

                                    {r.type === 'pdf' && r.url && (
                                        <div className="border rounded-lg overflow-hidden">
                                            <iframe src={googleViewerUrl(r.url)} className="w-full h-64" title={r.name} loading="lazy" />
                                        </div>
                                    )}

                                    {r.type === 'document' && r.url && (
                                        <div className="border rounded-lg overflow-hidden">
                                            {/* Fallback: office viewer for office docs, google viewer otherwise */}
                                            <iframe
                                                src={isOfficeDoc((r as any).mime) ? officeViewerUrl(r.url) : googleViewerUrl(r.url)}
                                                className="w-full h-64"
                                                title={r.name}
                                                loading="lazy"
                                            />
                                        </div>
                                    )}

                                    {r.type === 'video' && (
                                        r.youtubeId ? (
                                            <div className="aspect-video w-full rounded-lg overflow-hidden border">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${r.youtubeId}`}
                                                    title={r.name}
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allowFullScreen
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : r.url ? (
                                            <video controls src={r.url} className="w-full rounded-lg" />
                                        ) : null
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {pageCount > 1 && (
                        <Pagination className="mt-8">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious onClick={() => setPage(p => Math.max(p - 1, 1))} />
                                </PaginationItem>
                                <PaginationItem>
                                    <span className="text-sm">Page {page} of {pageCount}</span>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext onClick={() => setPage(p => Math.min(p + 1, pageCount))} />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editing} onOpenChange={(open) => !open && closeEdit()}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Resource</DialogTitle>
                        <DialogDescription>Update title, description, tags, and visibility.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Title</Label>
                            <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} />
                        </div>
                        <div>
                            <Label>Tags (comma separated)</Label>
                            <Input value={editTags} onChange={e => setEditTags(e.target.value)} />
                        </div>
                        <div>
                            <Label>Category</Label>
                            <Select value={editCategory} onValueChange={setEditCategory as any}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sermons">Sermons</SelectItem>
                                    <SelectItem value="studies">Bible Studies</SelectItem>
                                    <SelectItem value="events">Events</SelectItem>
                                    <SelectItem value="music">Music</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Switch id="edit-featured" checked={editFeatured} onCheckedChange={setEditFeatured} />
                                <Label htmlFor="edit-featured">Featured</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch id="edit-downloadable" checked={editDownloadable} onCheckedChange={setEditDownloadable} />
                                <Label htmlFor="edit-downloadable">Downloadable</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={closeEdit}>Cancel</Button>
                        <Button onClick={saveEdit} disabled={savingEdit}>
                            {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

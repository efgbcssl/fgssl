import { Resource, VideoResource, PDFResource, AudioResource } from './resource';

export interface VideoPlayerProps {
    video: VideoResource;
    isOpen: boolean;
    onClose: () => void;
}

export interface PDFViewerProps {
    resource: PDFResource;
    isOpen: boolean;
    onClose: () => void;
}

export interface AudioPlayerProps {
    resource: AudioResource;
    isOpen: boolean;
    onClose: () => void;
}

export interface ResourceCardProps {
    resource: Resource;
    variant?: 'grid' | 'list';
    onPlay?: (resource: Resource) => void;
    onDownload?: (resource: Resource) => void;
}
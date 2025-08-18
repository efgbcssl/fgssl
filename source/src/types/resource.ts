// src/types/resource.ts

export type ResourceType = "pdf" | "video" | "audio" | "link" | "image";

export interface BaseResource {
    id: string; // MongoDB ObjectId as string
    title: string;
    description?: string;
    type: ResourceType;

    // common optional presentation/UX fields
    thumbnailUrl?: string;    // preview image when present
    category?: string;
    tags?: string[];
    featured?: boolean;

    // counters
    views?: number;
    downloads?: number;

    // whether the resource can be downloaded
    downloadable?: boolean;

    // ISO strings (from mongoose timestamps)
    createdAt?: string;
    updatedAt?: string;


}

/** PDF */
export interface PDFResource extends BaseResource {
    type: "pdf";
    fileUrl: string;          // direct file url (ImageKit/S3)
    fileSize?: number;
    downloadUrl?: string;     // if different from fileUrl
}

/** Video */
export interface VideoResource extends BaseResource {
    type: "video";
    videoUrl: string;         // e.g., YouTube watch url or CDN
    duration?: string;        // "12:34" or "01:05:49"
    youtubeId?: string;       // optional for external link
    embedUrl?: string;        // optional iframe-ready url
}

/** Audio */
export interface AudioResource extends BaseResource {
    type: "audio";
    audioUrl: string;         // mp3/aac url
    fileSize?: number;
    duration?: string;        // "12:34"
    downloadUrl?: string;
}

/** Image */
export interface ImageResource extends BaseResource {
    type: "image";
    imageUrl: string;
    width?: number;
    height?: number;
    downloadUrl?: string;
}

export interface LinkResource extends BaseResource {
    type: "link"
    url: string
}


export type Resource =
    | PDFResource
    | VideoResource
    | AudioResource
    | ImageResource
    | LinkResource;

// src/components/resources/PDFViewer.tsx
import { PDFResource } from "@/types/resource";

interface PDFViewerProps {
    resource: PDFResource;
    isOpen: boolean;
    onClose: () => void;
}

export default function PDFViewer({ resource, isOpen, onClose }: PDFViewerProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-[80%] h-[80%]">
                <button onClick={onClose} className="absolute top-4 right-4 text-black">
                    ❌
                </button>
                <iframe src={resource.fileUrl} className="w-full h-full" />
            </div>
        </div>
    );
}

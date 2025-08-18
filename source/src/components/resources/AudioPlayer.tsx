// src/components/resources/AudioPlayer.tsx
import { AudioResource } from "@/types/resource";

interface AudioPlayerProps {
    resource: AudioResource;
    isOpen: boolean;
    onClose: () => void;
}

export default function AudioPlayer({ resource, isOpen, onClose }: AudioPlayerProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg">
                <button onClick={onClose} className="absolute top-4 right-4 text-black">
                    ❌
                </button>
                <h3 className="font-bold">{resource.title}</h3>
                <audio controls src={resource.audioUrl} className="w-full mt-2" />
            </div>
        </div>
    );
}

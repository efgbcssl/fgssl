export type Event = {
    id: string
    title: string
    description?: string
    date: string
    time: string
    location: string
    imageSrc: string
    ctaText: string
    ctaLink: string
    order: number
    expiresAt: string
}

export type XataEvent = Event & {
    xata_createdat: string;
    xata_updatedat: string;
    xata_version: number;
};
// src/app/api/dashboard/resources/imagekit/route.ts
import { NextResponse } from 'next/server'
import ImageKit from 'imagekit'
import { validateFileSize, validateFileType } from '@/lib/utils'

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
})

// Constants
const RESOURCE_BASE = '/resources'
const FOLDERS = {
    pdf: `${RESOURCE_BASE}/pdf`,
    audio: `${RESOURCE_BASE}/audio`,
}
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ACCEPTED_FILE_TYPES = {
    pdf: ['application/pdf'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac']
}

// Type definitions
interface Resource {
    fileId: string
    name: string
    type: 'pdf' | 'audio'
    url: string
    size: number
    uploadedAt: string
    downloadable?: boolean
    customMetadata?: {
        title?: string
        downloadable?: string
    }
}

// Helper functions
function detectResourceType(filename: string): 'pdf' | 'audio' {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'pdf'
    if (['mp3', 'wav', 'ogg', 'aac'].includes(ext!)) return 'audio'
    throw new Error('Unsupported file type')
}

function formatFileResponse(file: any): Resource {
    return {
        fileId: file.fileId,
        name: file.name,
        url: file.url,
        size: file.size,
        uploadedAt: file.createdAt,
        type: detectResourceType(file.name),
        downloadable: file.customMetadata?.downloadable !== 'false',
        customMetadata: file.customMetadata
    }
}

// GET - List resources by type
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type') as 'pdf' | 'audio' | null

        if (type && !FOLDERS[type]) {
            return NextResponse.json(
                { error: 'Invalid resource type' },
                { status: 400 }
            )
        }

        const folder = type ? FOLDERS[type] : RESOURCE_BASE
        const files = await imagekit.listFiles({ path: folder })

        // Filter out non-resource files and format response
        const resources = files
            .filter(file => {
                try {
                    return detectResourceType(file.name) === type
                } catch {
                    return false
                }
            })
            .map(formatFileResponse)

        return NextResponse.json(resources)
    } catch (error) {
        console.error('[RESOURCES_GET] Error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch resources' },
            { status: 500 }
        )
    }
}

// POST - Upload new resource
export async function POST(req: Request) {
    try {
        // Validate content type
        const contentType = req.headers.get('content-type') || ''
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json(
                { error: 'Invalid content-type. Expected multipart/form-data' },
                { status: 400 }
            )
        }

        // Parse form data
        const form = await req.formData()
        const file = form.get('file') as File | null
        const title = form.get('title') as string | null
        const type = form.get('type') as 'pdf' | 'audio' | null
        const downloadable = form.get('downloadable') as string | null

        // Validate required fields
        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }
        if (!type || !FOLDERS[type]) {
            return NextResponse.json(
                { error: 'Invalid resource type' },
                { status: 400 }
            )
        }

        // Validate file
        const fileValidation = validateFileType(file, ACCEPTED_FILE_TYPES[type]) ||
            validateFileSize(file, MAX_FILE_SIZE)
        if (fileValidation) {
            return NextResponse.json(
                { error: fileValidation },
                { status: 400 }
            )
        }

        // Prepare metadata
        const customMetadata = {
            title: title || file.name.replace(/\.[^/.]+$/, ""),
            downloadable: downloadable || 'true'
        }

        // Upload file
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        const uploaded = await imagekit.upload({
            file: fileBuffer,
            fileName: customMetadata.title + '.' + file.name.split('.').pop(),
            folder: FOLDERS[type],
            useUniqueFileName: true,
            customMetadata: customMetadata
        })

        return NextResponse.json(formatFileResponse(uploaded))
    } catch (error) {
        console.error('[RESOURCES_POST] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 }
        )
    }
}

// DELETE - Remove resource
export async function DELETE(req: Request) {
    try {
        const { fileId } = await req.json()

        if (!fileId) {
            return NextResponse.json(
                { error: 'Missing fileId' },
                { status: 400 }
            )
        }

        await imagekit.deleteFile(fileId)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[RESOURCES_DELETE] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Delete failed' },
            { status: 500 }
        )
    }
}

// PUT - Update resource metadata
export async function PUT(req: Request) {
    try {
        const { fileId, title, downloadable } = await req.json()

        if (!fileId) {
            return NextResponse.json(
                { error: 'Missing fileId' },
                { status: 400 }
            )
        }

        const customMetadata = {
            ...(title !== undefined && { title }),
            ...(downloadable !== undefined && { downloadable: downloadable ? 'true' : 'false' })
        }

        const updated = await imagekit.updateFileDetails(fileId, {
            customMetadata: customMetadata
        })

        return NextResponse.json(formatFileResponse(updated))
    } catch (error) {
        console.error('[RESOURCES_PUT] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Update failed' },
            { status: 500 }
        )
    }
}
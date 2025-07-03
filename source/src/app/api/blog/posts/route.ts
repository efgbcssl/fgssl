import { NextResponse } from 'next/server';
import { xata } from '@/lib/xata';


// Get all blog posts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('adminView') === 'true';

    try {
        let posts;
        if (adminView) {
            posts = await xata.db.posts.sort('createdAt', 'desc').getMany();
        } else {
            posts = await xata.db.posts
                .filter({
                    $any: [
                        { status: 'published' },
                        {
                            status: 'scheduled',
                            publishDate: { $le: new Date().toISOString() },
                        },
                    ],
                })
                .sort('publishDate', 'desc')
                .getMany();
        }

        return NextResponse.json(posts);
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch blog posts' },
            { status: 500 }
        );
    }
}

// Create a new blog post
export async function POST(request: Request) {
    const {
        title,
        content,
        excerpt,
        status,
        publishDate,
        categories,
        featuredImage,
        metaTitle,
        metaDescription,
    } = await request.json();

    if (!title || !content || !excerpt || !status) {
        return NextResponse.json(
            { error: 'Required fields are missing' },
            { status: 400 }
        );
    }

    try {
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const newPost = await xata.db.posts.create({
            title,
            slug,
            content,
            excerpt,
            status,
            publishDate: publishDate || null,
            categories: categories || [],
            featuredImage: featuredImage || '',
            metaTitle: metaTitle || '',
            metsDescription: metaDescription || '',
            likes: 0,
        });

        return NextResponse.json(newPost, { status: 201 });
    } catch (error) {
        console.error('Error creating blog post:', error);
        return NextResponse.json(
            { error: 'Failed to create blog post' },
            { status: 500 }
        );
    }
}
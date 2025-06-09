export default function BlogPost({ params }: { params: { slug: string } }) {
    const post = {
        id: params.slug,
        title: `Blog Post ${params.slug}`,
        content: "This is the content of the blog post. It would be fetched from a CMS or database in a real application.",
        category: "Technology"
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
            <div className="mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {post.category}
                </span>
            </div>
            <article className="prose lg:prose-xl">
                <p>{post.content}</p>
                <p>More content would go here...</p>
            </article>
        </div>
    )
}
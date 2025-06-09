export default function CategoryPage({ params }: { params: { category: string } }) {
    const posts = [
        { id: 1, title: `Post 1 in ${params.category}` },
        { id: 2, title: `Post 2 in ${params.category}` },
        { id: 3, title: `Post 3 in ${params.category}` }
    ]

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">
                Posts in {params.category.charAt(0).toUpperCase() + params.category.slice(1)}
            </h1>
            <div className="space-y-4">
                {posts.map(post => (
                    <div key={post.id} className="p-4 border rounded-lg">
                        <h2 className="text-xl font-semibold">{post.title}</h2>
                        <a
                            href={`/blog/${post.id}`}
                            className="text-blue-600 hover:underline"
                        >
                            Read more
                        </a>
                    </div>
                ))}
            </div>
        </div>
    )
}
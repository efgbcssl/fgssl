export default async function CategoryPage({ params }: { params: Promise<{ categories: string }> }) {
    const { categories } = await params;
    const posts = [
        { id: 1, title: `Post 1 in ${categories}` },
        { id: 2, title: `Post 2 in ${categories}` },
        { id: 3, title: `Post 3 in ${categories}` }
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">
                Posts in {categories.charAt(0).toUpperCase() + categories.slice(1)}
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
    );
}
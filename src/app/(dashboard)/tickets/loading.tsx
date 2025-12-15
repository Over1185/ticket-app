export default function TicketsLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2" />
                        </div>
                        <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                </div>

                {/* Filtros Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex gap-4">
                        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
                        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>

                {/* Tickets List Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                                </div>
                                <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

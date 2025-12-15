export default function TicketDetailLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header Skeleton */}
                <div className="mb-6">
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="h-10 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Ticket Info Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="space-y-4">
                        <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>

                {/* Timeline Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

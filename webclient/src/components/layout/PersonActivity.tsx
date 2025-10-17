interface PersonActivityProps {
  personId: string
}

export function PersonActivity({ personId }: PersonActivityProps) {
  // TODO: Implement activity feed
  // This would show history of changes, interactions, etc.
  
  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📈</span>
          </div>
          <h3 className="text-lg font-medium mb-2">Activity Feed</h3>
          <p className="text-muted-foreground">
            Coming soon - view interaction history, changes, and timeline.
          </p>
        </div>
      </div>
    </div>
  )
}
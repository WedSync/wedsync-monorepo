import * as React from "react"
import { cn } from "../lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { 
  ClockIcon, 
  MapPinIcon, 
  UsersIcon,
  PlusIcon,
  EditIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CircleIcon
} from "lucide-react"
import type { TimelineEvent, EventStatus } from '@wedsync/types'

interface TimelineViewProps {
  events: TimelineEvent[]
  onAddEvent?: () => void
  onEditEvent?: (event: TimelineEvent) => void
  onUpdateStatus?: (eventId: string, status: EventStatus) => void
  editable?: boolean
  className?: string
}

const eventStatusConfig: Record<EventStatus, { icon: React.ElementType; color: string; label: string }> = {
  planned: { icon: CircleIcon, color: "text-gray-500", label: "Planned" },
  confirmed: { icon: CheckCircleIcon, color: "text-blue-600", label: "Confirmed" },
  in_progress: { icon: AlertCircleIcon, color: "text-yellow-600", label: "In Progress" },
  completed: { icon: CheckCircleIcon, color: "text-green-600", label: "Completed" },
  cancelled: { icon: AlertCircleIcon, color: "text-red-600", label: "Cancelled" }
}

const TimelineView = React.forwardRef<HTMLDivElement, TimelineViewProps>(
  ({ 
    events, 
    onAddEvent, 
    onEditEvent, 
    onUpdateStatus,
    editable = true,
    className,
    ...props 
  }, ref) => {
    const sortedEvents = React.useMemo(() => {
      return [...events].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    }, [events])

    const formatTime = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(new Date(date))
    }

    const formatDuration = (startTime: Date, endTime?: Date) => {
      if (!endTime) return formatTime(startTime)
      
      const start = new Date(startTime)
      const end = new Date(endTime)
      const durationMs = end.getTime() - start.getTime()
      const durationHours = durationMs / (1000 * 60 * 60)
      
      if (durationHours < 1) {
        const minutes = Math.round(durationMs / (1000 * 60))
        return `${formatTime(start)} (${minutes}m)`
      } else {
        const hours = Math.floor(durationHours)
        const minutes = Math.round((durationHours - hours) * 60)
        return `${formatTime(start)} (${hours}h${minutes > 0 ? ` ${minutes}m` : ''})`
      }
    }

    const TimelineItem: React.FC<{ event: TimelineEvent; isLast: boolean }> = ({ event, isLast }) => {
      const statusConfig = eventStatusConfig[event.status]
      const StatusIcon = statusConfig.icon

      return (
        <div className="relative flex gap-4 pb-6">
          {/* Timeline Line */}
          <div className="flex flex-col items-center">
            <div className={cn("flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white", 
              event.status === 'completed' ? 'border-green-600' :
              event.status === 'in_progress' ? 'border-yellow-600' :
              event.status === 'confirmed' ? 'border-blue-600' :
              event.status === 'cancelled' ? 'border-red-600' :
              'border-gray-300'
            )}>
              <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
            </div>
            {!isLast && (
              <div className="w-0.5 h-full bg-gray-200 mt-2" />
            )}
          </div>
          
          {/* Event Content */}
          <div className="flex-1 min-w-0">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        <span>{formatDuration(event.startTime, event.endTime)}</span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      
                      {event.assignedSuppliers && event.assignedSuppliers.length > 0 && (
                        <div className="flex items-center gap-1">
                          <UsersIcon className="h-3 w-3" />
                          <span>{event.assignedSuppliers.length} supplier{event.assignedSuppliers.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                    
                    {event.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        event.status === 'completed' ? 'bg-green-100 text-green-800' :
                        event.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        event.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {statusConfig.label}
                      </span>
                      
                      {event.bufferBefore && (
                        <span className="text-xs text-muted-foreground">
                          {event.bufferBefore}m buffer before
                        </span>
                      )}
                      
                      {event.bufferAfter && (
                        <span className="text-xs text-muted-foreground">
                          {event.bufferAfter}m buffer after
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {editable && (
                    <div className="flex gap-1 ml-2">
                      {onEditEvent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditEvent(event)}
                          className="h-8 w-8 p-0"
                        >
                          <EditIcon className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Wedding Timeline ({events.length} events)
            </CardTitle>
            {editable && onAddEvent && (
              <Button onClick={onAddEvent} size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {sortedEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClockIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No timeline events added yet.</p>
              {editable && onAddEvent && (
                <Button variant="outline" onClick={onAddEvent} className="mt-2">
                  Add First Event
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              {sortedEvents.map((event, index) => (
                <TimelineItem 
                  key={event.id} 
                  event={event} 
                  isLast={index === sortedEvents.length - 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)

TimelineView.displayName = "TimelineView"

export { TimelineView }
export type { TimelineViewProps }
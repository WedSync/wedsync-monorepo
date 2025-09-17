import * as React from "react"
import { cn } from "../lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { CalendarIcon, MapPinIcon, UsersIcon, DollarSignIcon } from "lucide-react"
import type { Wedding, WeddingStatus } from '@wedsync/types'

interface WeddingCardProps {
  wedding: Wedding
  onEdit?: (wedding: Wedding) => void
  onView?: (wedding: Wedding) => void
  className?: string
}

const statusColors: Record<WeddingStatus, string> = {
  planning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-gray-100 text-gray-800 border-gray-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  postponed: "bg-orange-100 text-orange-800 border-orange-300"
}

const formatWeddingStatus = (status: WeddingStatus): string => {
  switch (status) {
    case 'in_progress': return 'In Progress'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

const WeddingCard = React.forwardRef<HTMLDivElement, WeddingCardProps>(
  ({ wedding, onEdit, onView, className, ...props }, ref) => {
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date(date))
    }

    const getDaysUntilWedding = () => {
      const today = new Date()
      const weddingDate = new Date(wedding.weddingDate)
      const timeDiff = weddingDate.getTime() - today.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      if (daysDiff < 0) return 'Past'
      if (daysDiff === 0) return 'Today!'
      if (daysDiff === 1) return 'Tomorrow'
      return `${daysDiff} days`
    }

    return (
      <Card
        ref={ref}
        className={cn("hover:shadow-md transition-shadow", className)}
        {...props}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold line-clamp-1">
                {wedding.title || `Wedding ${wedding.id.slice(-6)}`}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                    statusColors[wedding.status]
                  )}
                >
                  {formatWeddingStatus(wedding.status)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {getDaysUntilWedding()}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(wedding.weddingDate)}</span>
          </div>
          
          {(wedding.ceremonyVenue || wedding.receptionVenue) && (
            <div className="flex items-center gap-2 text-sm">
              <MapPinIcon className="h-4 w-4 text-muted-foreground" />
              <span className="line-clamp-1">
                {wedding.ceremonyVenue?.name || wedding.receptionVenue?.name}
                {wedding.ceremonyVenue && wedding.receptionVenue && wedding.ceremonyVenue.name !== wedding.receptionVenue.name && 
                  ` & ${wedding.receptionVenue.name}`
                }
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
            <span>{wedding.guestCount} guests</span>
          </div>
          
          {wedding.estimatedBudget && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              <span>
                ${wedding.estimatedBudget.toLocaleString()}
                {wedding.actualBudget && (
                  <span className="text-muted-foreground">
                    {' '}/ ${wedding.actualBudget.toLocaleString()}
                  </span>
                )}
              </span>
            </div>
          )}
          
          {wedding.theme && (
            <div className="text-sm">
              <span className="font-medium">Theme:</span> {wedding.theme}
            </div>
          )}
          
          {wedding.colorScheme && wedding.colorScheme.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Colors:</span>
              <div className="flex gap-1">
                {wedding.colorScheme.slice(0, 4).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {wedding.colorScheme.length > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{wedding.colorScheme.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(wedding)}
                className="flex-1"
              >
                View Details
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                onClick={() => onEdit(wedding)}
                className="flex-1"
              >
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)

WeddingCard.displayName = "WeddingCard"

export { WeddingCard }
export type { WeddingCardProps }
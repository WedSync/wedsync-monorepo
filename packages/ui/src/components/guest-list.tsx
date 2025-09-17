import * as React from "react"
import { cn } from "../lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { 
  CheckIcon, 
  XIcon, 
  ClockIcon, 
  SearchIcon,
  UserPlusIcon,
  MailIcon,
  PhoneIcon,
  EditIcon,
  TrashIcon
} from "lucide-react"
import type { Guest, RSVPStatus } from '@wedsync/types'

interface GuestListProps {
  guests: Guest[]
  onAddGuest?: () => void
  onEditGuest?: (guest: Guest) => void
  onDeleteGuest?: (guestId: string) => void
  onUpdateRSVP?: (guestId: string, status: RSVPStatus) => void
  searchable?: boolean
  editable?: boolean
  className?: string
}

const rsvpStatusConfig: Record<RSVPStatus, { icon: React.ElementType; color: string; label: string }> = {
  attending: { icon: CheckIcon, color: "text-green-600 bg-green-100", label: "Attending" },
  not_attending: { icon: XIcon, color: "text-red-600 bg-red-100", label: "Not Attending" },
  pending: { icon: ClockIcon, color: "text-yellow-600 bg-yellow-100", label: "Pending" },
  maybe: { icon: ClockIcon, color: "text-blue-600 bg-blue-100", label: "Maybe" }
}

const GuestList = React.forwardRef<HTMLDivElement, GuestListProps>(
  ({ 
    guests, 
    onAddGuest, 
    onEditGuest, 
    onDeleteGuest, 
    onUpdateRSVP,
    searchable = true,
    editable = true,
    className,
    ...props 
  }, ref) => {
    const [searchTerm, setSearchTerm] = React.useState("")
    
    const filteredGuests = React.useMemo(() => {
      if (!searchTerm) return guests
      
      return guests.filter(guest => {
        const searchLower = searchTerm.toLowerCase()
        return (
          `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(searchLower) ||
          guest.email?.toLowerCase().includes(searchLower) ||
          guest.relationship?.toLowerCase().includes(searchLower)
        )
      })
    }, [guests, searchTerm])
    
    const guestStats = React.useMemo(() => {
      return guests.reduce((acc, guest) => {
        acc[guest.rsvpStatus] = (acc[guest.rsvpStatus] || 0) + 1
        if (guest.plusOneAllowed && guest.rsvpStatus === 'attending') {
          acc.plusOnes = (acc.plusOnes || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
    }, [guests])

    const GuestRow: React.FC<{ guest: Guest }> = ({ guest }) => {
      const statusConfig = rsvpStatusConfig[guest.rsvpStatus]
      const StatusIcon = statusConfig.icon

      return (
        <div className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h4 className="font-medium text-sm truncate">
                  {guest.firstName} {guest.lastName}
                  {guest.plusOneAllowed && guest.plusOneName && (
                    <span className="text-muted-foreground"> & {guest.plusOneName}</span>
                  )}
                </h4>
                {guest.relationship && (
                  <p className="text-xs text-muted-foreground">{guest.relationship}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  {guest.email && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MailIcon className="h-3 w-3" />
                      <span className="truncate max-w-32">{guest.email}</span>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <PhoneIcon className="h-3 w-3" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", statusConfig.color)}>
                  <StatusIcon className="h-3 w-3" />
                  <span>{statusConfig.label}</span>
                </div>
                
                {guest.plusOneAllowed && (
                  <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    +1
                  </div>
                )}
                
                {guest.isHelper && (
                  <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    Helper
                  </div>
                )}
              </div>
              
              {editable && (
                <div className="flex gap-1">
                  {onEditGuest && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditGuest(guest)}
                      className="h-8 w-8 p-0"
                    >
                      <EditIcon className="h-3 w-3" />
                    </Button>
                  )}
                  {onDeleteGuest && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteGuest(guest.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Guest List ({guests.length})
            </CardTitle>
            {editable && onAddGuest && (
              <Button onClick={onAddGuest} size="sm">
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Add Guest
              </Button>
            )}
          </div>
          
          {/* Stats Row */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 rounded-full"></div>
              <span>Attending: {guestStats.attending || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 rounded-full"></div>
              <span>Not Attending: {guestStats.not_attending || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-100 rounded-full"></div>
              <span>Pending: {guestStats.pending || 0}</span>
            </div>
            {guestStats.plusOnes && (
              <div className="flex items-center gap-1">
                <span>Plus Ones: {guestStats.plusOnes}</span>
              </div>
            )}
          </div>
          
          {searchable && (
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search guests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          {filteredGuests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No guests found matching your search." : "No guests added yet."}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {filteredGuests.map((guest) => (
                <GuestRow key={guest.id} guest={guest} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)

GuestList.displayName = "GuestList"

export { GuestList }
export type { GuestListProps }
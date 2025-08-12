'use client'

import { Slot } from '@radix-ui/react-slot'
import { PanelLeftIcon } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { Button } from './button'

type SidebarContextProps = {
  state: 'expanded' | 'collapsed'
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.')
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [isMobile, setIsMobile] = React.useState(false)
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the internal state of the sidebar.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
    },
    [setOpenProp, open]
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Check if mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const state = open ? 'expanded' : 'collapsed'

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        style={
          {
            '--sidebar-width': '16rem',
            '--sidebar-width-icon': '3rem',
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          'group/sidebar-wrapper has-[[data-collapsible=icon]]:group-has-[[data-state=collapsed]]/sidebar-wrapper flex min-h-svh w-full',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'icon',
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
}) {
  const { isMobile, state, openMobile, setOpen } = useSidebar()
  const closeTimerRef = React.useRef<NodeJS.Timeout>()

  const handleMouseEnter = React.useCallback(() => {
    if (collapsible === 'icon' && state === 'collapsed') {
      // Cancel any pending close
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
      setOpen(true)
    }
  }, [collapsible, state, setOpen])

  const handleMouseLeave = React.useCallback(() => {
    if (collapsible === 'icon') {
      // Add small delay before closing
      closeTimerRef.current = setTimeout(() => {
        setOpen(false)
      }, 300) // 300ms delay
    }
  }, [collapsible, setOpen])

  React.useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  if (isMobile) {
    return openMobile ? (
      <div
        className="bg-sidebar text-sidebar-foreground fixed inset-0 z-50 flex w-full flex-col md:hidden"
        {...props}
      >
        {children}
      </div>
    ) : null
  }

  return (
    <div
      className={cn(
        'bg-sidebar text-sidebar-foreground group/sidebar hidden h-full shrink-0 transition-all duration-300 ease-in-out md:flex md:flex-col',
        // Width based on state and collapsible setting
        state === 'collapsed' && collapsible === 'icon'
          ? 'h-screen w-[var(--sidebar-width-icon)]'
          : 'h-screen w-[var(--sidebar-width)]',
        // Variant-specific styles
        variant === 'sidebar' &&
          cn(
            'fixed top-4 left-4 z-40 h-[calc(100vh-2rem)] rounded-lg border shadow-lg',
            'bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur'
          ),
        variant === 'floating' &&
          cn(
            'fixed top-4 left-4 z-40 h-[calc(100vh-2rem)] rounded-lg border shadow-lg',
            'bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur'
          ),
        variant === 'inset' && 'border-0 shadow-md',
        variant === 'sidebar' && 'border-r',
        className
      )}
      data-state={state}
      data-variant={variant}
      data-collapsible={collapsible}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('size-7', className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      aria-label="Toggle Sidebar"
      onClick={toggleSidebar}
      className={cn(
        'hover:bg-accent absolute inset-y-0 right-0 w-2',
        className
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      className={cn(
        'flex min-h-0 flex-1 flex-col',
        'group-has-[[data-variant=floating]]/sidebar-wrapper:ml-0',
        'group-has-[[data-variant=inset]]/sidebar-wrapper:ml-0',
        className
      )}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn('flex flex-col gap-2 p-4', className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('mt-auto flex flex-col gap-2 border-t p-4', className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex min-h-0 flex-1 flex-col gap-2 p-4', className)}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex w-full min-w-0 flex-col p-2', className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'div'

  return (
    <Comp
      className={cn(
        'text-muted-foreground px-2 py-1 text-xs font-medium transition-opacity duration-200',
        'group-has-[[data-collapsible=icon]]/sidebar-wrapper:group-data-[state=collapsed]/sidebar:hidden',
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('w-full text-sm', className)} {...props} />
}

function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      className={cn('flex w-full min-w-0 flex-col gap-1', className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={cn('relative', className)} {...props} />
}

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  tooltip,
  size = 'default',
  className,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string
  size?: 'default' | 'sm' | 'lg'
}) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      className={cn(
        'hover:bg-accent hover:text-accent-foreground relative flex w-full items-center gap-2 rounded-md text-left transition-colors',
        size === 'default' && 'h-8 px-2 text-sm',
        size === 'sm' && 'h-7 px-1 text-xs',
        size === 'lg' && 'h-12 px-2 text-sm',
        isActive && 'bg-accent text-accent-foreground font-medium',
        // Handle collapsed state text visibility
        'group-has-[[data-collapsible=icon]]/sidebar-wrapper:group-data-[state=collapsed]/sidebar:[&>span:last-child]:hidden',
        'group-has-[[data-collapsible=icon]]/sidebar-wrapper:group-data-[state=collapsed]/sidebar:justify-center',
        className
      )}
      title={tooltip}
      {...props}
    />
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      className={cn(
        'ml-4 flex min-w-0 flex-col gap-1 border-l py-1 pl-3',
        className
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<'li'>) {
  return <li className={cn('relative', className)} {...props} />
}

function SidebarMenuSubButton({
  asChild = false,
  isActive = false,
  className,
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean
  isActive?: boolean
}) {
  const Comp = asChild ? Slot : 'a'

  return (
    <Comp
      className={cn(
        'hover:bg-accent hover:text-accent-foreground flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sm transition-colors',
        isActive && 'bg-accent text-accent-foreground font-medium',
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
}

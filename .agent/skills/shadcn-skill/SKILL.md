---
name: shadcn-examples
description: Comprehensive guide for building UI with shadcn/ui components using Base UI primitives and Tailwind CSS
---

# Shadcn/UI Development Skill

## Overview

This skill provides patterns and examples for building React UI components using the modern shadcn/ui approach with:
- **@base-ui/react** - Headless UI primitives from Base UI
- **class-variance-authority (CVA)** - Type-safe variant management
- **Tailwind CSS** - Utility-first styling with `cn()` helper
- **@tabler/icons-react** - Icon library

## Core Utility Function

All components use the `cn()` utility from `@/lib/utils`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Component Architecture Patterns

### 1. Data-Slot Pattern

Every component exports a `data-slot` attribute for targeting and composition:

```tsx
<div data-slot="card" className={cn("...", className)} {...props} />
```

This enables:
- CSS targeting: `*:data-[slot=card-footer]:pb-0`
- Conditional styling: `has-data-[slot=card-action]:grid-cols-[1fr_auto]`
- Group scoping: `group/card`, `group-data-[size=sm]/card:px-3`

### 2. Variant System with CVA

Use `class-variance-authority` for type-safe variants:

```tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "base-classes-here rounded-lg border text-sm font-medium", // Base styles
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border-border bg-background hover:bg-muted",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive: "bg-destructive/10 text-destructive",
        secondary: "bg-secondary text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-2.5",
        sm: "h-7 gap-1 px-2.5 text-[0.8rem]",
        xs: "h-6 gap-1 px-2 text-xs",
        lg: "h-9 gap-1.5 px-2.5",
        icon: "size-8",
        "icon-xs": "size-6",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

### 3. Base UI Primitive Integration

Wrap Base UI primitives while preserving all props:

```tsx
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"

function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}
```

### 4. Render Prop Pattern

For polymorphic components, use the `render` prop:

```tsx
<AlertDialogCancel
  render={<Button variant="outline" size="default" />}
  {...props}
>
  Cancel
</AlertDialogCancel>
```

---

## Available Components

### Button

**File:** `@/components/ui/button`

**Variants:**
- `variant`: default | outline | secondary | ghost | destructive | link
- `size`: default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg

**Usage:**
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Submit</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost" size="icon">
  <IconSettings />
</Button>

{/* With inline icons using data-icon attribute */}
<Button>
  <IconPlus data-icon="inline-start" />
  Add Item
</Button>
```

**Key Tailwind classes:**
- Focus: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Invalid: `aria-invalid:ring-destructive/20 aria-invalid:border-destructive`
- Disabled: `disabled:pointer-events-none disabled:opacity-50`

---

### Badge

**File:** `@/components/ui/badge`

**Variants:** default | secondary | destructive | outline | ghost | link

**Usage:**
```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outlined</Badge>
```

**Supports polymorphism via `render` prop:**
```tsx
<Badge render={<a href="/link" />}>Clickable Badge</Badge>
```

---

### Card

**File:** `@/components/ui/card`

**Sub-components:** Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter

**Props:** `size?: "default" | "sm"`

**Usage:**
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

<Card size="default">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description text</CardDescription>
    <CardAction>
      <Button variant="ghost" size="icon">
        <IconDotsVertical />
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    <Button>Submit</Button>
  </CardFooter>
</Card>
```

**Group modifiers:** The Card uses `group/card` for child styling:
- `group-data-[size=sm]/card:px-3` - Apply styles when Card has sm size

---

### Alert Dialog

**File:** `@/components/ui/alert-dialog`

**Sub-components:** AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel

**Props:** `size?: "default" | "sm"` (on AlertDialogContent)

**Usage:**
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger render={<Button />}>
    Open Dialog
  </AlertDialogTrigger>
  <AlertDialogContent size="sm">
    <AlertDialogHeader>
      <AlertDialogMedia>
        <IconBluetooth />
      </AlertDialogMedia>
      <AlertDialogTitle>Allow connection?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Confirm</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Dropdown Menu

**File:** `@/components/ui/dropdown-menu`

**Sub-components:** DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem

**Usage:**
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
    <IconDotsVertical />
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuGroup>
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem>
        <IconFile />
        New File
        <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem variant="destructive">
        <IconLogout />
        Sign Out
      </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    
    {/* Submenu */}
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <IconSettings />
        Settings
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>Option 1</DropdownMenuItem>
        <DropdownMenuItem>Option 2</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    
    {/* Checkbox items */}
    <DropdownMenuCheckboxItem 
      checked={isChecked}
      onCheckedChange={setIsChecked}
    >
      <IconCheck />
      Show Sidebar
    </DropdownMenuCheckboxItem>
    
    {/* Radio group */}
    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
      <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Select

**File:** `@/components/ui/select`

**Sub-components:** Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectSeparator

**Props:** `size?: "sm" | "default"` (on SelectTrigger)

**Usage:**
```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const items = [
  { label: "Developer", value: "developer" },
  { label: "Designer", value: "designer" },
]

<Select items={items} defaultValue={null}>
  <SelectTrigger id="role-select">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      {items.map((item) => (
        <SelectItem key={item.value} value={item.value}>
          {item.label}
        </SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>
```

---

### Combobox

**File:** `@/components/ui/combobox`

**Sub-components:** Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxGroup, ComboboxLabel, ComboboxEmpty, ComboboxSeparator, ComboboxChips, ComboboxChip, ComboboxChipsInput

**Usage (single select):**
```tsx
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"]

<Combobox items={frameworks}>
  <ComboboxInput placeholder="Select a framework" />
  <ComboboxContent>
    <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item} value={item}>
          {item}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```

**Usage (multi-select with chips):**
```tsx
const anchor = useComboboxAnchor()

<Combobox items={items} multiple>
  <ComboboxChips ref={anchor}>
    {(chip) => <ComboboxChip key={chip}>{chip}</ComboboxChip>}
    <ComboboxChipsInput placeholder="Add tags..." />
  </ComboboxChips>
  <ComboboxContent anchor={anchor}>
    <ComboboxList>
      {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```

---

### Input

**File:** `@/components/ui/input`

**Usage:**
```tsx
import { Input } from "@/components/ui/input"

<Input 
  type="text"
  placeholder="Enter your name" 
  id="name-input"
/>
<Input type="email" placeholder="Email" disabled />
<Input type="file" />
```

---

### Input Group

**File:** `@/components/ui/input-group`

**Sub-components:** InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupInput, InputGroupTextarea

**Addon align options:** `inline-start` | `inline-end` | `block-start` | `block-end`

**Usage:**
```tsx
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

{/* With prefix icon */}
<InputGroup>
  <InputGroupAddon align="inline-start">
    <IconSearch />
  </InputGroupAddon>
  <InputGroupInput placeholder="Search..." />
</InputGroup>

{/* With suffix button */}
<InputGroup>
  <InputGroupInput placeholder="Enter URL" />
  <InputGroupAddon align="inline-end">
    <InputGroupButton size="icon-xs" variant="ghost">
      <IconCopy />
    </InputGroupButton>
  </InputGroupAddon>
</InputGroup>

{/* With text prefix */}
<InputGroup>
  <InputGroupAddon align="inline-start">
    <InputGroupText>https://</InputGroupText>
  </InputGroupAddon>
  <InputGroupInput placeholder="example.com" />
</InputGroup>
```

---

### Textarea

**File:** `@/components/ui/textarea`

**Usage:**
```tsx
import { Textarea } from "@/components/ui/textarea"

<Textarea placeholder="Add comments..." id="comments" />
```

---

### Label

**File:** `@/components/ui/label`

**Usage:**
```tsx
import { Label } from "@/components/ui/label"

<Label htmlFor="email">Email</Label>
```

---

### Field Components

**File:** `@/components/ui/field`

**Sub-components:** Field, FieldGroup, FieldSet, FieldLegend, FieldLabel, FieldTitle, FieldContent, FieldDescription, FieldError, FieldSeparator

**Orientation:** `vertical` | `horizontal` | `responsive`

**Usage:**
```tsx
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"

<FieldGroup>
  <div className="grid grid-cols-2 gap-4">
    <Field>
      <FieldLabel htmlFor="name">Name</FieldLabel>
      <Input id="name" placeholder="Enter your name" required />
    </Field>
    <Field>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input id="email" type="email" placeholder="email@example.com" />
      <FieldDescription>We'll never share your email.</FieldDescription>
    </Field>
  </div>
  <Field>
    <FieldLabel htmlFor="bio">Bio</FieldLabel>
    <Textarea id="bio" placeholder="Tell us about yourself" />
    <FieldError errors={formErrors.bio} />
  </Field>
  <Field orientation="horizontal">
    <Button type="submit">Submit</Button>
    <Button variant="outline" type="button">Cancel</Button>
  </Field>
</FieldGroup>
```

---

### Separator

**File:** `@/components/ui/separator`

**Props:** `orientation?: "horizontal" | "vertical"`

**Usage:**
```tsx
import { Separator } from "@/components/ui/separator"

<Separator />
<Separator orientation="vertical" className="h-4" />
```

---

## Tailwind CSS Patterns

### Animation Classes

```css
/* Open/Close animations */
.data-open:animate-in
.data-closed:animate-out
.data-closed:fade-out-0
.data-open:fade-in-0
.data-closed:zoom-out-95
.data-open:zoom-in-95

/* Slide from direction */
.data-[side=bottom]:slide-in-from-top-2
.data-[side=top]:slide-in-from-bottom-2
.data-[side=left]:slide-in-from-right-2
.data-[side=right]:slide-in-from-left-2
```

### Focus and State Styling

```css
/* Focus ring pattern */
focus-visible:border-ring
focus-visible:ring-ring/50
focus-visible:ring-[3px]

/* Invalid state */
aria-invalid:ring-destructive/20
aria-invalid:border-destructive
dark:aria-invalid:ring-destructive/40

/* Disabled state */
disabled:pointer-events-none
disabled:opacity-50
disabled:cursor-not-allowed
```

### Conditional CSS with Data Attributes

```css
/* Has selector with data-slot */
has-data-[slot=card-footer]:pb-0
has-data-[slot=card-action]:grid-cols-[1fr_auto]

/* Group data modifiers */
group-data-[size=sm]/card:px-3
group-data-[disabled=true]/field:opacity-50

/* In data context */
in-data-[slot=button-group]:rounded-lg

/* Direct children with data */
*:[img:first-child]:rounded-t-xl
```

### Responsive Container Queries

```css
/* Container query breakpoints */
@container/field-group
@md/field-group:flex-row
@container/card-header
```

### Icon Sizing

```css
/* Default icon size in components */
[&_svg:not([class*='size-'])]:size-4
[&_svg]:pointer-events-none
[&_svg]:shrink-0

/* Inline icon markers */
has-data-[icon=inline-start]:pl-2
has-data-[icon=inline-end]:pr-1.5
```

---

## Form Pattern Examples

### Complete Form Card

```tsx
<Card className="w-full max-w-md">
  <CardHeader>
    <CardTitle>User Information</CardTitle>
    <CardDescription>Please fill in your details below</CardDescription>
    <CardAction>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <IconDotsVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Save Draft</DropdownMenuItem>
          <DropdownMenuItem>Clear Form</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardAction>
  </CardHeader>
  <CardContent>
    <form>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" placeholder="Enter name" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="role">Role</FieldLabel>
            <Select items={roleItems}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {roleItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="framework">Framework</FieldLabel>
          <Combobox items={frameworks}>
            <ComboboxInput id="framework" placeholder="Select a framework" />
            <ComboboxContent>
              <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
        <Field>
          <FieldLabel htmlFor="comments">Comments</FieldLabel>
          <Textarea id="comments" placeholder="Additional comments" />
        </Field>
        <Field orientation="horizontal">
          <Button type="submit">Submit</Button>
          <Button variant="outline" type="button">Cancel</Button>
        </Field>
      </FieldGroup>
    </form>
  </CardContent>
</Card>
```

---

## Color Tokens (CSS Variables)

Standard shadcn color tokens used throughout:

| Token | Usage |
|-------|-------|
| `--background` | Page background |
| `--foreground` | Primary text |
| `--card` / `--card-foreground` | Card backgrounds |
| `--popover` / `--popover-foreground` | Popups, dropdowns |
| `--primary` / `--primary-foreground` | Primary actions |
| `--secondary` / `--secondary-foreground` | Secondary actions |
| `--muted` / `--muted-foreground` | Subdued elements |
| `--accent` / `--accent-foreground` | Hover states |
| `--destructive` | Error/danger states |
| `--border` | Default borders |
| `--input` | Input backgrounds |
| `--ring` | Focus rings |

---

## Best Practices

1. **Always use `data-slot`** for component identification
2. **Use CVA** for variant management instead of ternary conditions
3. **Preserve all primitive props** with spread operator `{...props}`
4. **Use `cn()` helper** for className merging
5. **Apply sensible defaults** for optional props
6. **Support both controlled and uncontrolled** patterns
7. **Use semantic HTML elements** where possible
8. **Include proper ARIA attributes** (handled by Base UI primitives)
9. **Use Tabler icons** with standard sizing via CSS
10. **Dark mode support** via `dark:` Tailwind prefix

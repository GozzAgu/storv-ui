/**
 * Storvv icons as components, named like the Lucide icons they replace, so
 * `import { Plus, Store } from '~/icons'` works with the same props as Lucide
 * (size, stroke-width, color, absolute-stroke-width). Drawings live in ./sets; see ./README.md.
 * The app imports icons only from here (an ESLint rule blocks @lucide/vue).
 */
import { defineComponent, h, type PropType } from 'vue'
import type { StorvvIconPart, StorvvIconSet } from './geometry'
import glyphs from './sets/glyphs'
import system from './sets/system'
import commerce from './sets/commerce'
import workspace from './sets/workspace'
import categories from './sets/categories'

export const STORVV_UI_ICONS: StorvvIconSet = {
  ...glyphs,
  ...system,
  ...commerce,
  ...workspace,
  ...categories,
}

const kebab = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([a-z])([0-9])/g, '$1-$2')
    .toLowerCase()

function renderPart(p: StorvvIconPart, i: number) {
  return h('path', {
    key: i,
    d: p.d,
    transform: p.transform,
    fill: p.tone ? 'currentColor' : 'none',
    'fill-opacity': p.tone ? (p.tone === 'fill' ? 0.3 : 0.14) : undefined,
    stroke: p.tone && !p.outline ? 'none' : undefined,
    'stroke-width': p.width,
  })
}

/** Build one icon component from a drawing in the registry. */
export function storvvIcon(name: string) {
  return defineComponent({
    name: `StorvvIcon${name}`,
    props: {
      size: { type: [Number, String] as PropType<number | string>, default: 24 },
      strokeWidth: { type: [Number, String] as PropType<number | string>, default: 1.75 },
      absoluteStrokeWidth: { type: Boolean, default: false },
      color: { type: String, default: 'currentColor' },
    },
    setup(props, { attrs }) {
      const parts = STORVV_UI_ICONS[name]
      if (import.meta.dev && !parts) console.warn(`[storvv icons] No drawing for "${name}"`)
      return () => {
        const sw = props.absoluteStrokeWidth
          ? (Number(props.strokeWidth) * 24) / Number(props.size)
          : props.strokeWidth
        return h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            width: props.size,
            height: props.size,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: props.color,
            'stroke-width': sw,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            // Decorative unless the caller labels it.
            'aria-hidden': attrs['aria-label'] || attrs['aria-labelledby'] ? undefined : 'true',
            focusable: 'false',
            class: ['lucide', `lucide-${kebab(name)}-icon`, 'sv-icon'],
          },
          (parts ?? []).map(renderPart)
        )
      }
    },
  })
}

export type StorvvUiIcon = ReturnType<typeof storvvIcon>

// ── Every icon the app uses ─────────────────────────────────────────────────
export const AlertCircle = storvvIcon('AlertCircle')
export const Apple = storvvIcon('Apple')
export const Archive = storvvIcon('Archive')
export const ArrowDown = storvvIcon('ArrowDown')
export const ArrowLeft = storvvIcon('ArrowLeft')
export const ArrowLeftRight = storvvIcon('ArrowLeftRight')
export const ArrowRight = storvvIcon('ArrowRight')
export const ArrowUp = storvvIcon('ArrowUp')
export const ArrowUpDown = storvvIcon('ArrowUpDown')
export const ArrowUpRight = storvvIcon('ArrowUpRight')
export const ArrowUpWideNarrow = storvvIcon('ArrowUpWideNarrow')
export const Award = storvvIcon('Award')
export const Baby = storvvIcon('Baby')
export const BadgeCheck = storvvIcon('BadgeCheck')
export const Banknote = storvvIcon('Banknote')
export const BarChart3 = storvvIcon('BarChart3')
export const BedDouble = storvvIcon('BedDouble')
export const Bell = storvvIcon('Bell')
export const BellRing = storvvIcon('BellRing')
export const Bike = storvvIcon('Bike')
export const Blocks = storvvIcon('Blocks')
export const BookOpen = storvvIcon('BookOpen')
export const Bookmark = storvvIcon('Bookmark')
export const Box = storvvIcon('Box')
export const Boxes = storvvIcon('Boxes')
export const BrickWall = storvvIcon('BrickWall')
export const Briefcase = storvvIcon('Briefcase')
export const Brush = storvvIcon('Brush')
export const Building = storvvIcon('Building')
export const Building2 = storvvIcon('Building2')
export const Cable = storvvIcon('Cable')
export const Calendar = storvvIcon('Calendar')
export const CalendarClock = storvvIcon('CalendarClock')
export const CalendarDays = storvvIcon('CalendarDays')
export const Camera = storvvIcon('Camera')
export const CandyCane = storvvIcon('CandyCane')
export const Car = storvvIcon('Car')
export const CarFront = storvvIcon('CarFront')
export const ChartArea = storvvIcon('ChartArea')
export const ChartColumn = storvvIcon('ChartColumn')
export const ChartColumnIncreasing = storvvIcon('ChartColumnIncreasing')
export const ChartNoAxesColumnIncreasing = storvvIcon('ChartNoAxesColumnIncreasing')
export const Check = storvvIcon('Check')
export const CheckCheck = storvvIcon('CheckCheck')
export const CheckCircle2 = storvvIcon('CheckCircle2')
export const ChevronDown = storvvIcon('ChevronDown')
export const ChevronLeft = storvvIcon('ChevronLeft')
export const ChevronRight = storvvIcon('ChevronRight')
export const ChevronUp = storvvIcon('ChevronUp')
export const ChevronsRight = storvvIcon('ChevronsRight')
export const ChevronsUpDown = storvvIcon('ChevronsUpDown')
export const Circle = storvvIcon('Circle')
export const CircleAlert = storvvIcon('CircleAlert')
export const CircleCheck = storvvIcon('CircleCheck')
export const CirclePlus = storvvIcon('CirclePlus')
export const CircleUser = storvvIcon('CircleUser')
export const CircleUserRound = storvvIcon('CircleUserRound')
export const CircleX = storvvIcon('CircleX')
export const Clipboard = storvvIcon('Clipboard')
export const ClipboardList = storvvIcon('ClipboardList')
export const Clock = storvvIcon('Clock')
export const CloudUpload = storvvIcon('CloudUpload')
export const Coffee = storvvIcon('Coffee')
export const Cog = storvvIcon('Cog')
export const Coins = storvvIcon('Coins')
export const CookingPot = storvvIcon('CookingPot')
export const Copy = storvvIcon('Copy')
export const Cpu = storvvIcon('Cpu')
export const CreditCard = storvvIcon('CreditCard')
export const Croissant = storvvIcon('Croissant')
export const Crown = storvvIcon('Crown')
export const CupSoda = storvvIcon('CupSoda')
export const Database = storvvIcon('Database')
export const DollarSign = storvvIcon('DollarSign')
export const Download = storvvIcon('Download')
export const Droplets = storvvIcon('Droplets')
export const Dumbbell = storvvIcon('Dumbbell')
export const Ellipsis = storvvIcon('Ellipsis')
export const EllipsisVertical = storvvIcon('EllipsisVertical')
export const ExternalLink = storvvIcon('ExternalLink')
export const Eye = storvvIcon('Eye')
export const EyeOff = storvvIcon('EyeOff')
export const Factory = storvvIcon('Factory')
export const FileCheck = storvvIcon('FileCheck')
export const FileDown = storvvIcon('FileDown')
export const FileSpreadsheet = storvvIcon('FileSpreadsheet')
export const FileText = storvvIcon('FileText')
export const Filter = storvvIcon('Filter')
export const Fingerprint = storvvIcon('Fingerprint')
export const Fish = storvvIcon('Fish')
export const FlaskConical = storvvIcon('FlaskConical')
export const Folder = storvvIcon('Folder')
export const FolderClosed = storvvIcon('FolderClosed')
export const FolderLock = storvvIcon('FolderLock')
export const FolderOpen = storvvIcon('FolderOpen')
export const FolderPlus = storvvIcon('FolderPlus')
export const FolderTree = storvvIcon('FolderTree')
export const Footprints = storvvIcon('Footprints')
export const Fuel = storvvIcon('Fuel')
export const Gamepad2 = storvvIcon('Gamepad2')
export const Gem = storvvIcon('Gem')
export const Gift = storvvIcon('Gift')
export const Glasses = storvvIcon('Glasses')
export const Globe = storvvIcon('Globe')
export const GraduationCap = storvvIcon('GraduationCap')
export const Guitar = storvvIcon('Guitar')
export const HandCoins = storvvIcon('HandCoins')
export const Handbag = storvvIcon('Handbag')
export const Handshake = storvvIcon('Handshake')
export const Hash = storvvIcon('Hash')
export const Headphones = storvvIcon('Headphones')
export const Headset = storvvIcon('Headset')
export const HeartPulse = storvvIcon('HeartPulse')
export const History = storvvIcon('History')
export const Home = storvvIcon('Home')
export const Inbox = storvvIcon('Inbox')
export const Info = storvvIcon('Info')
export const Key = storvvIcon('Key')
export const KeyRound = storvvIcon('KeyRound')
export const Lamp = storvvIcon('Lamp')
export const Landmark = storvvIcon('Landmark')
export const Languages = storvvIcon('Languages')
export const Laptop = storvvIcon('Laptop')
export const Layers2 = storvvIcon('Layers2')
export const LayoutDashboard = storvvIcon('LayoutDashboard')
export const LayoutGrid = storvvIcon('LayoutGrid')
export const LifeBuoy = storvvIcon('LifeBuoy')
export const Link2 = storvvIcon('Link2')
export const List = storvvIcon('List')
export const ListChecks = storvvIcon('ListChecks')
export const Loader2 = storvvIcon('Loader2')
export const Lock = storvvIcon('Lock')
export const LogOut = storvvIcon('LogOut')
export const Mail = storvvIcon('Mail')
export const MapPin = storvvIcon('MapPin')
export const Maximize2 = storvvIcon('Maximize2')
export const Medal = storvvIcon('Medal')
export const Megaphone = storvvIcon('Megaphone')
export const Menu = storvvIcon('Menu')
export const MessageCircle = storvvIcon('MessageCircle')
export const MessagesSquare = storvvIcon('MessagesSquare')
export const Milk = storvvIcon('Milk')
export const Minus = storvvIcon('Minus')
export const Monitor = storvvIcon('Monitor')
export const MonitorPlay = storvvIcon('MonitorPlay')
export const Moon = storvvIcon('Moon')
export const MousePointerClick = storvvIcon('MousePointerClick')
export const Network = storvvIcon('Network')
export const Package = storvvIcon('Package')
export const PackageCheck = storvvIcon('PackageCheck')
export const PackageMinus = storvvIcon('PackageMinus')
export const PackagePlus = storvvIcon('PackagePlus')
export const PackageSearch = storvvIcon('PackageSearch')
export const PackageX = storvvIcon('PackageX')
export const PaintBucket = storvvIcon('PaintBucket')
export const Palette = storvvIcon('Palette')
export const PanelLeftClose = storvvIcon('PanelLeftClose')
export const PanelLeftOpen = storvvIcon('PanelLeftOpen')
export const Paperclip = storvvIcon('Paperclip')
export const Pause = storvvIcon('Pause')
export const PawPrint = storvvIcon('PawPrint')
export const Pencil = storvvIcon('Pencil')
export const PencilLine = storvvIcon('PencilLine')
export const Phone = storvvIcon('Phone')
export const Pill = storvvIcon('Pill')
export const Play = storvvIcon('Play')
export const PlugZap = storvvIcon('PlugZap')
export const Plus = storvvIcon('Plus')
export const Printer = storvvIcon('Printer')
export const QrCode = storvvIcon('QrCode')
export const Receipt = storvvIcon('Receipt')
export const ReceiptText = storvvIcon('ReceiptText')
export const RefreshCcwDot = storvvIcon('RefreshCcwDot')
export const RefreshCw = storvvIcon('RefreshCw')
export const Refrigerator = storvvIcon('Refrigerator')
export const Repeat = storvvIcon('Repeat')
export const Rocket = storvvIcon('Rocket')
export const RotateCcw = storvvIcon('RotateCcw')
export const RotateCw = storvvIcon('RotateCw')
export const Router = storvvIcon('Router')
export const ScanBarcode = storvvIcon('ScanBarcode')
export const Scissors = storvvIcon('Scissors')
export const Search = storvvIcon('Search')
export const SearchCheck = storvvIcon('SearchCheck')
export const SearchX = storvvIcon('SearchX')
export const Send = storvvIcon('Send')
export const SendHorizontal = storvvIcon('SendHorizontal')
export const Settings = storvvIcon('Settings')
export const Settings2 = storvvIcon('Settings2')
export const Shapes = storvvIcon('Shapes')
export const Share2 = storvvIcon('Share2')
export const Shield = storvvIcon('Shield')
export const ShieldCheck = storvvIcon('ShieldCheck')
export const Shirt = storvvIcon('Shirt')
export const ShoppingBag = storvvIcon('ShoppingBag')
export const ShoppingBasket = storvvIcon('ShoppingBasket')
export const ShoppingCart = storvvIcon('ShoppingCart')
export const SlidersHorizontal = storvvIcon('SlidersHorizontal')
export const Smartphone = storvvIcon('Smartphone')
export const Snowflake = storvvIcon('Snowflake')
export const Sofa = storvvIcon('Sofa')
export const Sparkles = storvvIcon('Sparkles')
export const Split = storvvIcon('Split')
export const Spool = storvvIcon('Spool')
export const SprayCan = storvvIcon('SprayCan')
export const Sprout = storvvIcon('Sprout')
export const SquarePen = storvvIcon('SquarePen')
export const Stethoscope = storvvIcon('Stethoscope')
export const Store = storvvIcon('Store')
export const Sun = storvvIcon('Sun')
export const SunMedium = storvvIcon('SunMedium')
export const SunMoon = storvvIcon('SunMoon')
export const Table = storvvIcon('Table')
export const Tablet = storvvIcon('Tablet')
export const TabletSmartphone = storvvIcon('TabletSmartphone')
export const Tag = storvvIcon('Tag')
export const Tags = storvvIcon('Tags')
export const Target = storvvIcon('Target')
export const Tent = storvvIcon('Tent')
export const ToggleRight = storvvIcon('ToggleRight')
export const Tractor = storvvIcon('Tractor')
export const Trash2 = storvvIcon('Trash2')
export const TriangleAlert = storvvIcon('TriangleAlert')
export const Truck = storvvIcon('Truck')
export const Tv = storvvIcon('Tv')
export const Undo2 = storvvIcon('Undo2')
export const Upload = storvvIcon('Upload')
export const User = storvvIcon('User')
export const UserCog = storvvIcon('UserCog')
export const UserMinus = storvvIcon('UserMinus')
export const UserPlus = storvvIcon('UserPlus')
export const UserRound = storvvIcon('UserRound')
export const UserRoundCheck = storvvIcon('UserRoundCheck')
export const Users = storvvIcon('Users')
export const UsersRound = storvvIcon('UsersRound')
export const UtensilsCrossed = storvvIcon('UtensilsCrossed')
export const Wallet = storvvIcon('Wallet')
export const Watch = storvvIcon('Watch')
export const WifiOff = storvvIcon('WifiOff')
export const Wine = storvvIcon('Wine')
export const Workflow = storvvIcon('Workflow')
export const Wrench = storvvIcon('Wrench')
export const X = storvvIcon('X')
export const Zap = storvvIcon('Zap')

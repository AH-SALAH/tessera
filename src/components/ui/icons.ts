// components/ui/icons.ts
// Single source of truth for all app icons (Feather icons via react-icons/fi).
// Import from here instead of directly from react-icons/fi to keep
// icon choices consistent and auditable.

// Navigation
export {
  FiFolder as IconProjects,
  FiUsers as IconUsers,
  FiDatabase as IconDatabase,
  FiTerminal as IconLogs,
  FiPlus as IconPlus,
  FiGrid as IconDashboard,
} from "react-icons/fi";

// Actions
export {
  FiEdit2 as IconEdit,
  FiTrash2 as IconDelete,
  FiUser as IconAccount,
  FiLogOut as IconSignOut,
  FiChevronDown as IconChevronDown,
  FiZap as IconAiAssist,
} from "react-icons/fi";

// Status
export { FiCheckCircle as IconPublished, FiClock as IconDraft } from "react-icons/fi";

// Theme
export {
  FiSun as IconSun,
  FiMoon as IconMoon,
  FiMonitor as IconDeviceDesktop,
} from "react-icons/fi";

// Language
export { FiGlobe as IconGlobe } from "react-icons/fi";

// Content
export {
  FiArrowRight as IconArrowRight,
  FiChevronRight as IconChevronRight,
  FiUpload as IconUpload,
  FiSave as IconSave,
  FiRepeat as IconSwap,
} from "react-icons/fi";

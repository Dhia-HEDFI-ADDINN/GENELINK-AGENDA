// Utils
export { cn } from './utils/cn';

// Components
export { Button, type ButtonProps } from './components/Button/Button';
export { Input, type InputProps } from './components/Input/Input';
export { Select, type SelectProps, type SelectOption } from './components/Select/Select';
export { Card, CardHeader, CardContent, CardFooter, type CardProps } from './components/Card/Card';
export { Badge, getRdvStatusVariant, getRdvStatusLabel, type BadgeProps } from './components/Badge/Badge';
export { Modal, ModalFooter, type ModalProps } from './components/Modal/Modal';
export { TimeSlot, TimeSlotGrid, type TimeSlotData, type TimeSlotProps, type TimeSlotGridProps } from './components/TimeSlot/TimeSlot';
export { DatePicker, type DatePickerProps } from './components/Calendar/DatePicker';
export { Alert, type AlertProps } from './components/Alert/Alert';
export { Spinner, LoadingOverlay, type SpinnerProps, type LoadingOverlayProps } from './components/Spinner/Spinner';
export { Steps, type Step, type StepsProps } from './components/Steps/Steps';

// Re-export commonly used icons
export {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  TruckIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

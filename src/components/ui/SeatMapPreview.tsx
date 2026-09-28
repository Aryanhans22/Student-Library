import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Armchair,
  Zap,
  Sun,
  Wifi,
  VolumeX,
  Volume2,
  Layers,
  Sparkles,
  ArrowRight,
  DoorOpen,
  Library,
  Headphones,
  Users,
  MessagesSquare,
  BookOpen,
  Bath,
  Droplets,
  CheckCircle2,
  Clock,
  Compass,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SeatAmenity {
  hasPower: boolean;
  hasWindowView: boolean;
  hasLamp: boolean;
  noiseLevel: 'silent' | 'moderate';
  deskSize: string;
}

interface FloorSeat {
  id: string;
  number: string;
  floor: 1 | 2;
  section: string;
  sectionName: string;
  zoneType: 'cabin' | 'open' | 'discussion';
  status: 'available' | 'occupied' | 'reserved';
  userInitials?: string;
  amenities: SeatAmenity;
}

const FLOOR_SEATS: FloorSeat[] = [
  // ==========================================
  // FLOOR 1: Ground Floor - Silent Sanctuary & Cabins
  // ==========================================
  // Zone 1: Individual Study Cabins (Acoustic focus pods)
  {
    id: '1-A01',
    number: 'A01',
    floor: 1,
    section: 'A',
    sectionName: 'Individual Study Cabins',
    zoneType: 'cabin',
    status: 'occupied',
    userInitials: 'AS',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: true, noiseLevel: 'silent', deskSize: '120cm Acoustic Pod' }
  },
  {
    id: '1-A02',
    number: 'A02',
    floor: 1,
    section: 'A',
    sectionName: 'Individual Study Cabins',
    zoneType: 'cabin',
    status: 'available',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: true, noiseLevel: 'silent', deskSize: '120cm Acoustic Pod' }
  },
  {
    id: '1-A03',
    number: 'A03',
    floor: 1,
    section: 'A',
    sectionName: 'Individual Study Cabins',
    zoneType: 'cabin',
    status: 'available',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: true, noiseLevel: 'silent', deskSize: '110cm Focus Pod' }
  },
  {
    id: '1-A04',
    number: 'A04',
    floor: 1,
    section: 'A',
    sectionName: 'Individual Study Cabins',
    zoneType: 'cabin',
    status: 'reserved',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: true, noiseLevel: 'silent', deskSize: '120cm Acoustic Pod' }
  },

  // Zone 2: Open Study Area (Central Academic Quads)
  {
    id: '1-A05',
    number: 'A05',
    floor: 1,
    section: 'A',
    sectionName: 'Open Study Area (Central Quad)',
    zoneType: 'open',
    status: 'available',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: true, noiseLevel: 'silent', deskSize: '130cm Quad Desk' }
  },
  {
    id: '1-A06',
    number: 'A06',
    floor: 1,
    section: 'A',
    sectionName: 'Open Study Area (Central Quad)',
    zoneType: 'open',
    status: 'occupied',
    userInitials: 'VS',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: true, noiseLevel: 'silent', deskSize: '130cm Quad Desk' }
  },
  {
    id: '1-A07',
    number: 'A07',
    floor: 1,
    section: 'A',
    sectionName: 'Open Study Area (Central Quad)',
    zoneType: 'open',
    status: 'available',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: false, noiseLevel: 'silent', deskSize: '130cm Quad Desk' }
  },
  {
    id: '1-A08',
    number: 'A08',
    floor: 1,
    section: 'A',
    sectionName: 'Open Study Area (Central Quad)',
    zoneType: 'open',
    status: 'available',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: true, noiseLevel: 'silent', deskSize: '130cm Quad Desk' }
  },

  // Zone 2 (cont): Open Study Area (Garden Daylight Desks)
  {
    id: '1-B01',
    number: 'B01',
    floor: 1,
    section: 'B',
    sectionName: 'Open Study Area (Daylight Desks)',
    zoneType: 'open',
    status: 'available',
    amenities: { hasPower: true, hasWindowView: true, hasLamp: true, noiseLevel: 'silent', deskSize: '140cm Wide Oak Desk' }
  },
  {
    id: '1-B02',
    number: 'B02',
    floor: 1,
    section: 'B',
    sectionName: 'Open Study Area (Daylight Desks)',
    zoneType: 'open',
    status: 'occupied',
    userInitials: 'DP',
    amenities: { hasPower: true, hasWindowView: true, hasLamp: true, noiseLevel: 'silent', deskSize: '140cm Wide Oak Desk' }
  },
  {
    id: '1-B03',
    number: 'B03',
    floor: 1,
    section: 'B',
    sectionName: 'Open Study Area (Daylight Desks)',
    zoneType: 'open',
    status: 'available',
    amenities: { hasPower: false, hasWindowView: true, hasLamp: false, noiseLevel: 'silent', deskSize: '120cm Daylight Desk' }
  },
  {
    id: '1-B04',
    number: 'B04',
    floor: 1,
    section: 'B',
    sectionName: 'Open Study Area (Daylight Desks)',
    zoneType: 'open',
    status: 'available',
    amenities: { hasPower: true, hasWindowView: true, hasLamp: true, noiseLevel: 'silent', deskSize: '140cm Wide Oak Desk' }
  },

  // ==========================================
  // FLOOR 2: Upper Floor - Collaborative Commons & Tech
  // ==========================================
  // Zone 3: Discussion Area (Brainstorming pods)
  {
    id: '2-D01',
    number: 'D01',
    floor: 2,
    section: 'D',
    sectionName: 'Discussion Area',
    zoneType: 'discussion',
    status: 'occupied',
    userInitials: 'RD',
    amenities: { hasPower: true, hasWindowView: true, hasLamp: true, noiseLevel: 'moderate', deskSize: '140cm Collaborative Desk' }
  },
  {
    id: '2-D02',
    number: 'D02',
    floor: 2,
    section: 'D',
    sectionName: 'Discussion Area',
    zoneType: 'discussion',
    status: 'available',
    amenities: { hasPower: true, hasWindowView: true, hasLamp: true, noiseLevel: 'moderate', deskSize: '140cm Collaborative Desk' }
  },
  {
    id: '2-D03',
    number: 'D03',
    floor: 2,
    section: 'D',
    sectionName: 'Discussion Area',
    zoneType: 'discussion',
    status: 'available',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: true, noiseLevel: 'moderate', deskSize: '130cm Quad Discussion Desk' }
  },
  {
    id: '2-D04',
    number: 'D04',
    floor: 2,
    section: 'D',
    sectionName: 'Discussion Area',
    zoneType: 'discussion',
    status: 'reserved',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: true, noiseLevel: 'moderate', deskSize: '130cm Quad Discussion Desk' }
  },

  // Digital Tech Stations (Upper Open Floor)
  {
    id: '2-C01',
    number: 'C01',
    floor: 2,
    section: 'C',
    sectionName: 'Open Tech Stations',
    zoneType: 'open',
    status: 'available',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: true, noiseLevel: 'moderate', deskSize: '150cm Dual-Monitor Desk' }
  },
  {
    id: '2-C02',
    number: 'C02',
    floor: 2,
    section: 'C',
    sectionName: 'Open Tech Stations',
    zoneType: 'open',
    status: 'occupied',
    userInitials: 'AG',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: true, noiseLevel: 'moderate', deskSize: '150cm Dual-Monitor Desk' }
  },
  {
    id: '2-C03',
    number: 'C03',
    floor: 2,
    section: 'C',
    sectionName: 'Open Tech Stations',
    zoneType: 'open',
    status: 'available',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: true, noiseLevel: 'moderate', deskSize: '150cm Dual-Monitor Desk' }
  },
  {
    id: '2-C04',
    number: 'C04',
    floor: 2,
    section: 'C',
    sectionName: 'Open Tech Stations',
    zoneType: 'open',
    status: 'available',
    amenities: { hasPower: true, hasWindowView: false, hasLamp: false, noiseLevel: 'moderate', deskSize: '130cm Coding Station' }
  }
];

// Clean Facility Area Markers required by the planning interface
interface FacilityAreaMarker {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  color: string;
  bgLight: string;
  borderLight: string;
  badge: string;
  description: string;
}

const FACILITY_AREAS: FacilityAreaMarker[] = [
  {
    id: 'entrance',
    name: 'Entrance',
    category: 'Access Portal',
    icon: DoorOpen,
    color: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    badge: 'Main Gate',
    description: 'RFID turnstiles & biometric student attendance'
  },
  {
    id: 'reception',
    name: 'Reception',
    category: 'Member Desk',
    icon: Library,
    color: 'text-indigo-700',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    badge: 'Helpdesk',
    description: 'Librarian assistance, pass printing & locker keys'
  },
  {
    id: 'cabins',
    name: 'Individual Study Cabins',
    category: 'Silent Zone',
    icon: Headphones,
    color: 'text-purple-700',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    badge: '<30 dB Silent',
    description: 'Acoustic isolated cabins for competitive focus'
  },
  {
    id: 'open-study',
    name: 'Open Study Area',
    category: 'Main Reading Hall',
    icon: Users,
    color: 'text-blue-700',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    badge: 'Daylight Carrels',
    description: 'Central academic quads with wide natural light'
  },
  {
    id: 'discussion',
    name: 'Discussion Area',
    category: 'Group Pods',
    icon: MessagesSquare,
    color: 'text-amber-700',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    badge: 'Collaborative',
    description: 'Glass-partitioned rooms for group study & projects'
  },
  {
    id: 'bookshelves',
    name: 'Bookshelves',
    category: 'Academic Stacks',
    icon: BookOpen,
    color: 'text-teal-700',
    bgLight: 'bg-teal-50',
    borderLight: 'border-teal-200',
    badge: 'Reference Stacks',
    description: 'Exam materials, UPSC/JEE reference & periodicals'
  },
  {
    id: 'drinking-water',
    name: 'Drinking Water',
    category: 'Refreshment Hub',
    icon: Droplets,
    color: 'text-cyan-700',
    bgLight: 'bg-cyan-50',
    borderLight: 'border-cyan-200',
    badge: 'Chilled RO',
    description: 'Touchless UV-purified RO drinking water dispenser'
  },
  {
    id: 'washroom',
    name: 'Washroom',
    category: 'Sanitation',
    icon: Bath,
    color: 'text-slate-700',
    bgLight: 'bg-slate-100',
    borderLight: 'border-slate-300',
    badge: 'Hygienic',
    description: 'Clean, sanitized executive restrooms on both floors'
  }
];

export function SeatMapPreview() {
  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);
  const [filterType, setFilterType] = useState<'all' | 'available' | 'power' | 'window'>('all');
  const [selectedSeat, setSelectedSeat] = useState<FloorSeat | null>(null);
  const [highlightedArea, setHighlightedArea] = useState<string | null>(null);

  const floorSeats = FLOOR_SEATS.filter((s) => s.floor === activeFloor);

  const filteredSeats = floorSeats.filter((seat) => {
    if (filterType === 'available') return seat.status === 'available';
    if (filterType === 'power') return seat.amenities.hasPower;
    if (filterType === 'window') return seat.amenities.hasWindowView;
    return true;
  });

  const totalSeats = floorSeats.length;
  const availableCount = floorSeats.filter((s) => s.status === 'available').length;
  const occupiedCount = floorSeats.filter((s) => s.status === 'occupied').length;
  const occupancyPercentage = Math.round((occupiedCount / totalSeats) * 100);

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 lg:p-10 text-slate-900 border border-slate-200 shadow-xl shadow-slate-200/50 relative">
      {/* 1. Facility Area Markers & Directory Grid (All 8 Required Areas) */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Facility Areas & Key Amenities
            </span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline-block">
            Hover or tap any zone marker to view facility details
          </span>
        </div>

        {/* 8 Clean Cards / Labels / Markers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
          {FACILITY_AREAS.map((area) => {
            const Icon = area.icon;
            const isHighlighted = highlightedArea === area.id;

            return (
              <button
                key={area.id}
                onClick={() => setHighlightedArea(highlightedArea === area.id ? null : area.id)}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isHighlighted
                    ? `${area.bgLight} ${area.borderLight} ring-2 ring-indigo-500 shadow-md`
                    : 'bg-slate-50/80 hover:bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${area.bgLight} ${area.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${area.bgLight} ${area.color}`}>
                    {area.badge}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">
                    {area.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight line-clamp-1">
                    {area.category}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Highlighted Area Detail Banner (if clicked) */}
        {highlightedArea && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3.5 p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs flex items-center justify-between gap-3 text-indigo-950"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>{FACILITY_AREAS.find((a) => a.id === highlightedArea)?.name}:</strong>{' '}
                {FACILITY_AREAS.find((a) => a.id === highlightedArea)?.description}
              </span>
            </div>
            <button
              onClick={() => setHighlightedArea(null)}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </div>

      {/* 2. Interactive Map Header & Floor Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-600 uppercase">
              Live Floor Radar Active
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{activeFloor === 1 ? 'Floor 1 • Ground Floor' : 'Floor 2 • Upper Commons'}</span>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              {activeFloor === 1 ? 'Silent Sanctuary & Cabins' : 'Collaborative Commons & Tech'}
            </span>
          </h3>
        </div>

        {/* Floor Switcher Buttons */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => {
              setActiveFloor(1);
              setSelectedSeat(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFloor === 1
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Floor 1 (Ground Floor)</span>
          </button>
          <button
            onClick={() => {
              setActiveFloor(2);
              setSelectedSeat(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFloor === 2
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Floor 2 (Upper Floor)</span>
          </button>
        </div>
      </div>

      {/* 3. Filter Bar & Telemetry HUD */}
      <div className="my-5 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Amenity Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 font-semibold text-[11px] uppercase mr-1">Filter Desks:</span>
          {[
            { id: 'all', label: 'All Desks' },
            { id: 'available', label: '🟢 Available Only' },
            { id: 'power', label: '⚡ Power Sockets' },
            { id: 'window', label: '☀️ Natural Light' }
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilterType(chip.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium border transition cursor-pointer ${
                filterType === chip.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Live Occupancy Gauge Pill */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Available:</span>
            <span className="font-mono font-bold text-emerald-600">{availableCount}</span>
          </div>
          <div className="w-[1px] h-3.5 bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Occupied:</span>
            <span className="font-mono font-bold text-indigo-600">{occupiedCount}</span>
          </div>
          <div className="w-[1px] h-3.5 bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Occupancy:</span>
            <span className="font-mono font-bold text-amber-600">{occupancyPercentage}%</span>
          </div>
        </div>
      </div>

      {/* 4. Architectural Floor Blueprint Canvas (Neutral & Light Facility Layout) */}
      <div className="bg-slate-50/90 rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-inner relative">
        {/* Blueprint Perimeter Headers (Entrance, Reception, Water, Washroom) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-4 mb-6 border-b border-dashed border-slate-300 text-[11px] font-mono">
          {/* Perimeter 1: Entrance */}
          <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="p-1 bg-emerald-100 text-emerald-700 rounded-lg">
              <DoorOpen className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 block">MAIN ENTRANCE & RFID TURNSTILES</span>
              <span className="text-[10px] text-slate-500">Biometric entry portal</span>
            </div>
          </div>

          {/* Perimeter 2: Reception */}
          <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="p-1 bg-indigo-100 text-indigo-700 rounded-lg">
              <Library className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 block">RECEPTION & LIBRARIAN HELPDESK</span>
              <span className="text-[10px] text-slate-500">Digital pass onboarding & lockers</span>
            </div>
          </div>

          {/* Perimeter 3: Drinking Water & Washrooms */}
          <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="p-1 bg-cyan-100 text-cyan-700 rounded-lg">
              <Droplets className="w-3.5 h-3.5" />
            </div>
            <div className="p-1 bg-slate-200 text-slate-700 rounded-lg">
              <Bath className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 block">DRINKING WATER & RESTROOMS</span>
              <span className="text-[10px] text-slate-500">Chilled RO filtration & hygiene hub</span>
            </div>
          </div>
        </div>

        {/* Spatial Floor Zones */}
        <div className="space-y-6">
          {activeFloor === 1 ? (
            <>
              {/* Floor 1 - Zone Alpha: Individual Study Cabins */}
              <div className="p-4 bg-white rounded-2xl border border-purple-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 tracking-tight block">
                        Individual Study Cabins (Zone Alpha)
                      </span>
                      <span className="text-[10px] text-purple-700 font-medium">
                        Acoustically insulated private pods for deep focus
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    <VolumeX className="w-3.5 h-3.5 text-purple-700" /> &lt;30 dB Silent Policy
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {filteredSeats
                    .filter((s) => s.zoneType === 'cabin')
                    .map((seat) => renderSeatNode(seat))}
                </div>
              </div>

              {/* Floor 1 - Zone Beta: Open Study Area (Central Academic Quads) */}
              <div className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 tracking-tight block">
                        Open Study Area • Central Academic Quads (Zone Beta)
                      </span>
                      <span className="text-[10px] text-blue-700 font-medium">
                        Ergonomic 4-seat study clusters with dedicated task lighting
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <Zap className="w-3.5 h-3.5 text-amber-600" /> USB-C 65W & 230V Sockets
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {filteredSeats
                    .filter((s) => s.section === 'A' && s.zoneType === 'open')
                    .map((seat) => renderSeatNode(seat))}
                </div>
              </div>

              {/* Floor 1 - Zone Gamma: Open Study Area (Daylight Window Desks) & Bookshelves */}
              <div className="p-4 bg-white rounded-2xl border border-teal-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 tracking-tight block">
                        Open Study Area • Garden Daylight Bar (Zone Gamma)
                      </span>
                      <span className="text-[10px] text-teal-700 font-medium">
                        Natural lighting, wide oak desks, and immediate access to reference stacks
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <BookOpen className="w-3.5 h-3.5 text-teal-700" /> Beside Academic Bookshelves
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {filteredSeats
                    .filter((s) => s.section === 'B')
                    .map((seat) => renderSeatNode(seat))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Floor 2 - Zone Delta: Discussion Area */}
              <div className="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                      <MessagesSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 tracking-tight block">
                        Discussion Area (Zone Delta)
                      </span>
                      <span className="text-[10px] text-amber-700 font-medium">
                        Collaborative study pods, glass-walled conference tables & peer review
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Volume2 className="w-3.5 h-3.5 text-amber-700" /> Moderate Collaborative Discussion
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {filteredSeats
                    .filter((s) => s.zoneType === 'discussion')
                    .map((seat) => renderSeatNode(seat))}
                </div>
              </div>

              {/* Floor 2 - Zone Epsilon: Digital Tech Stations */}
              <div className="p-4 bg-white rounded-2xl border border-indigo-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 tracking-tight block">
                        Open Study Area • Digital Tech Stations (Zone Epsilon)
                      </span>
                      <span className="text-[10px] text-indigo-700 font-medium">
                        Extra wide desks, dual monitors, high-speed Ethernet & laptop charging
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    <Zap className="w-3.5 h-3.5 text-indigo-700" /> Dedicated High-Speed Wi-Fi 6
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {filteredSeats
                    .filter((s) => s.section === 'C')
                    .map((seat) => renderSeatNode(seat))}
                </div>
              </div>
            </>
          )}

          {/* Reference Bookshelves Graphic Perimeter Marker */}
          <div className="p-4 bg-gradient-to-r from-teal-50 via-slate-50 to-indigo-50 rounded-2xl border border-teal-200/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-100 text-teal-800 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Reference Bookshelves & Periodical Archive (Aisle 1–6)
                </span>
                <span className="text-[11px] text-slate-600">
                  UPSC, JEE, NEET, CA, and NCERT foundational literature available for in-hall study
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
              <span className="px-2.5 py-1 bg-white rounded-lg border border-teal-200 shadow-2xs">
                Free In-Library Borrowing
              </span>
            </div>
          </div>
        </div>

        {/* Blueprint Footer / Amenities Strip */}
        <div className="mt-6 pt-4 border-t border-dashed border-slate-300 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-700">
              <Wifi className="w-3.5 h-3.5 text-indigo-600" /> Gigabit Wi-Fi 6 (1 Gbps)
            </span>
            <span className="flex items-center gap-1 text-slate-700">
              <Zap className="w-3.5 h-3.5 text-amber-600" /> USB-C 65W Fast Charge
            </span>
            <span className="flex items-center gap-1 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-emerald-600" /> Open 6:00 AM – 11:30 PM
            </span>
          </div>
          <div className="text-slate-500 font-mono italic">
            *Click on any available green desk to reserve and register
          </div>
        </div>
      </div>

      {/* 5. Interactive Seat Inspector Drawer / Modal */}
      <AnimatePresence>
        {selectedSeat && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="mt-6 bg-white border-2 border-indigo-500 rounded-2xl p-5 shadow-2xl relative z-20"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200 text-indigo-600">
                  <Armchair className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900">
                      Study Desk {selectedSeat.number}
                    </h4>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Floor {selectedSeat.floor} • {selectedSeat.sectionName}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        selectedSeat.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : selectedSeat.status === 'occupied'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {selectedSeat.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Configuration: <strong>{selectedSeat.amenities.deskSize}</strong> with Ergonomic Mesh Lumbar Chair.
                    {selectedSeat.amenities.hasWindowView && ' Direct campus greenery & natural sunlight window view.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                    {selectedSeat.amenities.hasPower && (
                      <span className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-amber-800 border border-amber-200">
                        <Zap className="w-3 h-3 text-amber-600" /> Power Socket Available
                      </span>
                    )}
                    {selectedSeat.amenities.hasLamp && (
                      <span className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded text-indigo-800 border border-indigo-200">
                        <Sun className="w-3 h-3 text-indigo-600" /> Dedicated Warm Reading Lamp
                      </span>
                    )}
                    <span className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded text-emerald-800 border border-emerald-200">
                      <VolumeX className="w-3 h-3 text-emerald-600" />
                      {selectedSeat.amenities.noiseLevel === 'silent' ? 'Strict Silent Policy' : 'Collaborative Tech Policy'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedSeat(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 transition cursor-pointer"
                >
                  Close
                </button>

                {selectedSeat.status === 'available' ? (
                  <Link
                    to={`/student/register?seat=${selectedSeat.number}`}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-5 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <span>Register to Reserve Desk {selectedSeat.number}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="text-xs text-slate-500 italic bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
                    Currently assigned to student {selectedSeat.userInitials}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  function renderSeatNode(seat: FloorSeat) {
    const isSelected = selectedSeat?.id === seat.id;
    let bgStyle = 'bg-emerald-50/90 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100 text-emerald-900 shadow-2xs';
    let pillBadge = 'bg-emerald-100 text-emerald-800';
    let statusLabel = 'Available';

    if (seat.status === 'occupied') {
      bgStyle = 'bg-indigo-50/90 border-indigo-200 text-indigo-900 hover:bg-indigo-100/90';
      pillBadge = 'bg-indigo-100 text-indigo-800';
      statusLabel = `Occupied (${seat.userInitials})`;
    } else if (seat.status === 'reserved') {
      bgStyle = 'bg-amber-50/90 border-amber-200 text-amber-900 hover:bg-amber-100/90';
      pillBadge = 'bg-amber-100 text-amber-800';
      statusLabel = 'Reserved';
    }

    return (
      <motion.button
        key={seat.id}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setSelectedSeat(seat)}
        className={`relative flex flex-col items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${bgStyle} ${
          isSelected ? 'ring-2 ring-indigo-600 ring-offset-2 ring-offset-white shadow-lg' : ''
        }`}
      >
        {/* Top Indicators */}
        <div className="w-full flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono font-semibold opacity-75">
            {seat.amenities.hasWindowView ? '☀️ Window' : seat.zoneType === 'cabin' ? '🎧 Cabin' : '📖 Desk'}
          </span>
          {seat.amenities.hasPower && (
            <span className="text-amber-600" title="Equipped with power socket">
              <Zap className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Seat Icon */}
        <Armchair className="w-6 h-6 my-1 opacity-90 text-current" />

        {/* Number & Status */}
        <div className="w-full text-center mt-1">
          <span className="font-mono font-extrabold text-sm text-slate-900 block">
            {seat.number}
          </span>
          <span className={`text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block ${pillBadge}`}>
            {statusLabel}
          </span>
        </div>
      </motion.button>
    );
  }
}

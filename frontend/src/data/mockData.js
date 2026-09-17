// Mock data standing in for the Postgres schema in Section 12 of the requirements doc.
// Shapes mirror the real tables (users, entrepreneur_profiles, services, availability_slots, bookings)
// so swapping in real API calls later is a drop-in.

export const categories = [
  { id: "cat-beauty", name: "Beauty", tag: "beauty" },
  { id: "cat-food", name: "Food", tag: "food" },
  { id: "cat-tech", name: "Tech", tag: "tech" },
  { id: "cat-academics", name: "Academics", tag: "academics" },
];

export const mockUsers = [
  {
    id: "u-student-1",
    fullName: "Ama Boateng",
    email: "ama.boateng@ug.edu.gh",
    password: "password123",
    role: "student",
  },
  {
    id: "u-ent-1",
    fullName: "Kwame Owusu",
    email: "kwame@campushive.com",
    password: "password123",
    role: "entrepreneur",
  },
  {
    id: "u-ent-2",
    fullName: "Efua Mensah",
    email: "efua@campushive.com",
    password: "password123",
    role: "entrepreneur",
  },
  {
    id: "u-ent-3",
    fullName: "Kojo Antwi",
    email: "kojo@campushive.com",
    password: "password123",
    role: "entrepreneur",
  },
  {
    id: "u-admin-1",
    fullName: "Nana Adjei",
    email: "admin@campushive.com",
    password: "password123",
    role: "admin",
  },
];

export const mockEntrepreneurProfiles = [
  {
    id: "ep-1",
    userId: "u-ent-1",
    businessName: "Kwame's Barber Studio",
    description:
      "Fades, line-ups, and beard grooming, five minutes from Commonwealth Hall. Walk-ins welcome but booking guarantees your slot.",
    phoneNumber: "024 555 0142",
    location: "Commonwealth Hall, Block C",
    verificationStatus: "verified",
    rejectionReason: null,
    createdAt: "2026-08-02",
  },
  {
    id: "ep-2",
    userId: "u-ent-2",
    businessName: "Efua's Braids & Twists",
    description:
      "Box braids, cornrows, and knotless styles. Bring your own hair or buy on-site.",
    phoneNumber: "020 333 8871",
    location: "Volta Hall Annex",
    verificationStatus: "pending",
    rejectionReason: null,
    createdAt: "2026-09-10",
  },
  {
    id: "ep-3",
    userId: "u-ent-3",
    businessName: "Kojo Antwi Photography",
    description: "Graduation shoots, portraits, and event coverage.",
    phoneNumber: "",
    location: "Legon Hall",
    verificationStatus: "rejected",
    rejectionReason:
      "Business phone number is missing — please add a way for students to reach you directly.",
    createdAt: "2026-09-05",
  },
];

export const mockServices = [
  {
    id: "svc-1",
    entrepreneurId: "ep-1",
    categoryId: "cat-beauty",
    title: "Skin Fade + Line-up",
    description: "Precision fade with a sharp line-up finish.",
    price: 35,
    durationMinutes: 40,
    locationType: "provider_location",
    isActive: true,
  },
  {
    id: "svc-2",
    entrepreneurId: "ep-1",
    categoryId: "cat-beauty",
    title: "Beard Trim",
    description: "Shape-up and beard oil finish.",
    price: 15,
    durationMinutes: 20,
    locationType: "provider_location",
    isActive: true,
  },
  {
    id: "svc-3",
    entrepreneurId: "ep-2",
    categoryId: "cat-beauty",
    title: "Knotless Braids (Medium)",
    description: "Full head, medium-size knotless braids. Hair not included.",
    price: 180,
    durationMinutes: 240,
    locationType: "provider_location",
    isActive: true,
  },
  {
    id: "svc-4",
    entrepreneurId: "ep-3",
    categoryId: "cat-beauty",
    title: "Graduation Portrait Session",
    description: "30-minute shoot, 10 edited digital photos.",
    price: 120,
    durationMinutes: 30,
    locationType: "customer_location",
    isActive: true,
  },
];

export const mockAvailabilitySlots = [
  {
    id: "slot-1",
    serviceId: "svc-1",
    slotDate: "2026-09-15",
    startTime: "09:00",
    endTime: "09:40",
    isBooked: false,
  },
  {
    id: "slot-2",
    serviceId: "svc-1",
    slotDate: "2026-09-15",
    startTime: "10:00",
    endTime: "10:40",
    isBooked: true,
  },
  {
    id: "slot-3",
    serviceId: "svc-1",
    slotDate: "2026-09-15",
    startTime: "11:00",
    endTime: "11:40",
    isBooked: false,
  },
  {
    id: "slot-4",
    serviceId: "svc-1",
    slotDate: "2026-09-16",
    startTime: "09:00",
    endTime: "09:40",
    isBooked: false,
  },
  {
    id: "slot-5",
    serviceId: "svc-2",
    slotDate: "2026-09-15",
    startTime: "13:00",
    endTime: "13:20",
    isBooked: false,
  },
  {
    id: "slot-6",
    serviceId: "svc-2",
    slotDate: "2026-09-15",
    startTime: "13:30",
    endTime: "13:50",
    isBooked: false,
  },
];

export const mockBookings = [
  {
    id: "bk-1",
    studentId: "u-student-1",
    serviceId: "svc-1",
    slotId: "slot-2",
    bookingReference: "CH-8841",
    serviceNameSnapshot: "Skin Fade + Line-up",
    status: "confirmed",
    createdAt: "2026-09-10T09:12:00Z",
  },
];

// --- Derived helpers (stand-ins for API/DB joins) ---

export function getVerifiedProviders() {
  return mockEntrepreneurProfiles.filter(
    (p) => p.verificationStatus === "verified",
  );
}

export function getProviderById(id) {
  return mockEntrepreneurProfiles.find((p) => p.id === id);
}

export function getServicesForProvider(entrepreneurId) {
  return mockServices.filter((s) => s.entrepreneurId === entrepreneurId);
}

export function getServiceById(id) {
  return mockServices.find((s) => s.id === id);
}

export function getSlotsForService(serviceId) {
  return mockAvailabilitySlots.filter((s) => s.serviceId === serviceId);
}

export function getCategoryById(id) {
  return categories.find((c) => c.id === id);
}

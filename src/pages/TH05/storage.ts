import moment from 'moment';
import type { ApplicationHistory, ApplicationItem, ApplicationStatus, Club, TH05State } from './types';

const KEY = 'th05-club-management-v1';
const uid = () => Math.random().toString(36).slice(2, 10);

const seed = (): TH05State => {
  const club1: Club = {
    id: uid(),
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400',
    name: 'CLB Cong Nghe',
    establishedDate: '2024-09-01',
    descriptionHtml: '<p>CLB nghien cuu lap trinh va AI</p>',
    leaderName: 'Nguyen Van A',
    active: true,
    createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
  };

  const club2: Club = {
    id: uid(),
    imageUrl: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=400',
    name: 'CLB Truyen Thong',
    establishedDate: '2024-10-01',
    descriptionHtml: '<p>CLB to chuc su kien va noi dung so</p>',
    leaderName: 'Tran Thi B',
    active: true,
    createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
  };

  const app1: ApplicationItem = {
    id: uid(),
    fullName: 'Le Minh C',
    email: 'minhc@gmail.com',
    phone: '0988123123',
    gender: 'Male',
    address: 'Ha Noi',
    school: 'PTIT',
    clubId: club1.id,
    reason: 'Em muon tham gia hoc thuat',
    status: 'PENDING',
    createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
  };

  const histories: ApplicationHistory[] = [
    {
      id: uid(),
      applicationId: app1.id,
      action: 'CREATE',
      note: 'Tao don dang ky',
      actor: 'Admin',
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return { clubs: [club1, club2], applications: [app1], histories };
};

export const loadState = (): TH05State => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const init = seed();
      localStorage.setItem(KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw) as TH05State;
  } catch {
    return seed();
  }
};

export const saveState = (state: TH05State) => {
  localStorage.setItem(KEY, JSON.stringify(state));
};

const addHistory = (
  state: TH05State,
  applicationId: string,
  action: ApplicationHistory['action'],
  note: string,
  actor = 'Admin',
): TH05State => ({
  ...state,
  histories: [
    {
      id: uid(),
      applicationId,
      action,
      note,
      actor,
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
    },
    ...state.histories,
  ],
});

export const upsertClub = (
  state: TH05State,
  payload: Omit<Club, 'id' | 'createdAt'>,
  id?: string,
): TH05State => {
  if (!id) {
    const club: Club = {
      id: uid(),
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
      ...payload,
    };
    return { ...state, clubs: [club, ...state.clubs] };
  }

  return {
    ...state,
    clubs: state.clubs.map((c) => (c.id === id ? { ...c, ...payload } : c)),
  };
};

export const removeClub = (state: TH05State, clubId: string): TH05State => ({
  ...state,
  clubs: state.clubs.filter((c) => c.id !== clubId),
  applications: state.applications.filter((a) => a.clubId !== clubId),
});

export const upsertApplication = (
  state: TH05State,
  payload: Omit<ApplicationItem, 'id' | 'createdAt' | 'updatedAt'>,
  id?: string,
): TH05State => {
  if (!id) {
    const item: ApplicationItem = {
      id: uid(),
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
      ...payload,
    };

    return addHistory(
      { ...state, applications: [item, ...state.applications] },
      item.id,
      'CREATE',
      `Tao don cho ${item.fullName}`,
    );
  }

  const next = {
    ...state,
    applications: state.applications.map((a) =>
      a.id === id
        ? { ...a, ...payload, updatedAt: moment().format('YYYY-MM-DD HH:mm:ss') }
        : a,
    ),
  };

  return addHistory(next, id, 'UPDATE', 'Cap nhat don');
};

export const removeApplication = (state: TH05State, id: string): TH05State =>
  addHistory(
    { ...state, applications: state.applications.filter((a) => a.id !== id) },
    id,
    'DELETE',
    'Xoa don',
  );

export const reviewApplication = (
  state: TH05State,
  ids: string[],
  status: ApplicationStatus,
  rejectReason?: string,
): TH05State => {
  if (status === 'REJECTED' && !rejectReason?.trim()) {
    throw new Error('Tu choi phai nhap ly do');
  }

  let next = {
    ...state,
    applications: state.applications.map((a) =>
      ids.includes(a.id)
        ? {
            ...a,
            status,
            rejectReason: status === 'REJECTED' ? rejectReason : undefined,
            updatedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
          }
        : a,
    ),
  };

  ids.forEach((id) => {
    next = addHistory(
      next,
      id,
      status === 'APPROVED' ? 'APPROVE' : 'REJECT',
      status === 'APPROVED' ? 'Duyet don' : `Tu choi: ${rejectReason}`,
    );
  });

  return next;
};

export const transferMembersClub = (
  state: TH05State,
  ids: string[],
  toClubId: string,
): TH05State => {
  let next = {
    ...state,
    applications: state.applications.map((a) =>
      ids.includes(a.id)
        ? { ...a, clubId: toClubId, updatedAt: moment().format('YYYY-MM-DD HH:mm:ss') }
        : a,
    ),
  };

  ids.forEach((id) => {
    next = addHistory(next, id, 'TRANSFER_CLUB', `Chuyen CLB sang ${toClubId}`);
  });

  return next;
};
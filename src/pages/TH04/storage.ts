import moment from 'moment';
import type { DynamicField, SearchPayload, TH04State, VanBangRecord } from './types';

const STORAGE_KEY = 'th04-van-bang-state-v1';

const uid = () => Math.random().toString(36).slice(2, 10);

const normalize = (value?: string) => (value || '').trim().toLowerCase();

const emptyState = (): TH04State => ({
	soVanBangs: [],
	quyetDinhs: [],
	dynamicFields: [],
	vanBangs: [],
});

export const loadState = (): TH04State => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return emptyState();
		const parsed = JSON.parse(raw);
		return {
			soVanBangs: parsed?.soVanBangs || [],
			quyetDinhs: parsed?.quyetDinhs || [],
			dynamicFields: parsed?.dynamicFields || [],
			vanBangs: parsed?.vanBangs || [],
		};
	} catch {
		return emptyState();
	}
};

export const persistState = (state: TH04State) => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const createSoVanBang = (
	state: TH04State,
	payload: { nam: number; maSo: string; ngayMoSo: string },
): TH04State => {
	if (state.soVanBangs.some((item) => item.nam === Number(payload.nam))) {
		throw new Error('Mỗi năm chỉ có 1 sổ văn bằng');
	}

	const nextItem = {
		id: uid(),
		nam: Number(payload.nam),
		maSo: payload.maSo.trim(),
		ngayMoSo: payload.ngayMoSo,
	};

	return {
		...state,
		soVanBangs: [nextItem, ...state.soVanBangs],
	};
};

export const createQuyetDinh = (
	state: TH04State,
	payload: {
		soQD: string;
		ngayBanHanh: string;
		trichYeu: string;
		soVanBangId: string;
	},
): TH04State => {
	const soExists = state.soVanBangs.some((item) => item.id === payload.soVanBangId);
	if (!soExists) {
		throw new Error('Sổ văn bằng không tồn tại');
	}

	const nextItem = {
		id: uid(),
		soQD: payload.soQD.trim(),
		ngayBanHanh: payload.ngayBanHanh,
		trichYeu: payload.trichYeu.trim(),
		soVanBangId: payload.soVanBangId,
	};

	return {
		...state,
		quyetDinhs: [nextItem, ...state.quyetDinhs],
	};
};

export const createDynamicField = (
	state: TH04State,
	payload: DynamicField,
): TH04State => {
	const key = payload.key.trim();
	if (state.dynamicFields.some((item) => item.key === key)) {
		throw new Error('Key trường động đã tồn tại');
	}

	const nextItem = {
		...payload,
		id: uid(),
		key,
		label: payload.label.trim(),
	};

	return {
		...state,
		dynamicFields: [nextItem, ...state.dynamicFields],
	};
};

const nextSoVaoSo = (records: VanBangRecord[], soVanBangId: string) => {
	const items = records.filter((item) => item.soVanBangId === soVanBangId);
	if (!items.length) return 1;
	return Math.max(...items.map((item) => item.soVaoSo)) + 1;
};

export const createVanBang = (
	state: TH04State,
	payload: {
		soVanBangId: string;
		quyetDinhId: string;
		soHieuVanBang: string;
		maSinhVien: string;
		hoTen: string;
		ngaySinh: string;
		dynamicValues: Record<string, unknown>;
	},
): TH04State => {
	const soExists = state.soVanBangs.some((item) => item.id === payload.soVanBangId);
	if (!soExists) {
		throw new Error('Sổ văn bằng không tồn tại');
	}

	const qdExists = state.quyetDinhs.some((item) => item.id === payload.quyetDinhId);
	if (!qdExists) {
		throw new Error('Quyết định không tồn tại');
	}

	const normalizedDynamicValues: Record<string, string | number> = {};
	state.dynamicFields.forEach((field) => {
		const value = payload.dynamicValues?.[field.key];
		if (field.required && (value === undefined || value === null || value === '')) {
			throw new Error(`Thiếu trường bắt buộc: ${field.label}`);
		}
		if (value === undefined || value === null || value === '') return;

		if (field.dataType === 'NUMBER') normalizedDynamicValues[field.key] = Number(value);
		else if (field.dataType === 'DATE') normalizedDynamicValues[field.key] = moment(value as string).format('YYYY-MM-DD');
		else normalizedDynamicValues[field.key] = String(value).trim();
	});

	const record: VanBangRecord = {
		id: uid(),
		soVanBangId: payload.soVanBangId,
		quyetDinhId: payload.quyetDinhId,
		soVaoSo: nextSoVaoSo(state.vanBangs, payload.soVanBangId),
		soHieuVanBang: payload.soHieuVanBang.trim(),
		maSinhVien: payload.maSinhVien.trim(),
		hoTen: payload.hoTen.trim(),
		ngaySinh: payload.ngaySinh,
		dynamicValues: normalizedDynamicValues,
		createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
	};

	return {
		...state,
		vanBangs: [record, ...state.vanBangs],
	};
};

export const searchVanBang = (state: TH04State, payload: SearchPayload): VanBangRecord[] => {
	const inputCount = [
		payload.soHieuVanBang,
		payload.soVaoSo,
		payload.maSinhVien,
		payload.hoTen,
		payload.ngaySinh,
	].filter((item) => item !== undefined && item !== null && item !== '').length;

	if (inputCount < 2) {
		throw new Error('Cần nhập ít nhất 2 tham số để tra cứu');
	}

	return state.vanBangs.filter((item) => {
		const bySoHieu = payload.soHieuVanBang
			? normalize(item.soHieuVanBang).includes(normalize(payload.soHieuVanBang))
			: true;
		const bySoVaoSo = payload.soVaoSo ? item.soVaoSo === Number(payload.soVaoSo) : true;
		const byMaSinhVien = payload.maSinhVien
			? normalize(item.maSinhVien).includes(normalize(payload.maSinhVien))
			: true;
		const byHoTen = payload.hoTen ? normalize(item.hoTen).includes(normalize(payload.hoTen)) : true;
		const byNgaySinh = payload.ngaySinh ? item.ngaySinh === payload.ngaySinh : true;

		return bySoHieu && bySoVaoSo && byMaSinhVien && byHoTen && byNgaySinh;
	});
};

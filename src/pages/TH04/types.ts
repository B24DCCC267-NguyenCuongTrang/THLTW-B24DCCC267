export type FieldType = 'STRING' | 'NUMBER' | 'DATE';

export interface SoVanBang {
	id: string;
	nam: number;
	maSo: string;
	ngayMoSo: string;
}

export interface QuyetDinh {
	id: string;
	soQD: string;
	ngayBanHanh: string;
	trichYeu: string;
	soVanBangId: string;
}

export interface DynamicField {
	id: string;
	key: string;
	label: string;
	dataType: FieldType;
	required: boolean;
}

export interface VanBangRecord {
	id: string;
	soVanBangId: string;
	quyetDinhId: string;
	soVaoSo: number;
	soHieuVanBang: string;
	maSinhVien: string;
	hoTen: string;
	ngaySinh: string;
	dynamicValues: Record<string, string | number>;
	createdAt: string;
}

export interface SearchPayload {
	soHieuVanBang?: string;
	soVaoSo?: number;
	maSinhVien?: string;
	hoTen?: string;
	ngaySinh?: string;
}

export interface TH04State {
	soVanBangs: SoVanBang[];
	quyetDinhs: QuyetDinh[];
	dynamicFields: DynamicField[];
	vanBangs: VanBangRecord[];
}

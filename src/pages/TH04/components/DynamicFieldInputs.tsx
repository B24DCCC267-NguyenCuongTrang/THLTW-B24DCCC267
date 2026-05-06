import { DatePicker, Form, Input, InputNumber } from 'antd';
import type { DynamicField } from '../types';

interface Props {
	fields: DynamicField[];
}

const DynamicFieldInputs = ({ fields }: Props) => {
	return (
		<>
			{fields.map((field) => {
				const itemName = ['dynamicValues', field.key];
				const rules = field.required ? [{ required: true, message: `Vui lòng nhập ${field.label}` }] : undefined;

				if (field.dataType === 'NUMBER') {
					return (
						<Form.Item key={field.id} name={itemName} label={field.label} rules={rules}>
							<InputNumber style={{ width: '100%' }} placeholder={`Nhập ${field.label}`} />
						</Form.Item>
					);
				}

				if (field.dataType === 'DATE') {
					return (
						<Form.Item key={field.id} name={itemName} label={field.label} rules={rules}>
							<DatePicker style={{ width: '100%' }} format='DD/MM/YYYY' />
						</Form.Item>
					);
				}

				return (
					<Form.Item key={field.id} name={itemName} label={field.label} rules={rules}>
						<Input placeholder={`Nhập ${field.label}`} />
					</Form.Item>
				);
			})}
		</>
	);
};

export default DynamicFieldInputs;


import React from 'react';
import { 
    Plus, 
    Trash2, 
    Type, 
    Link, 
    FileUp, 
    CheckSquare, 
    ChevronDown,
    Hash
} from 'lucide-react';

export interface Field {
    id: string;
    label: string;
    type: 'text' | 'url' | 'file' | 'checkbox' | 'number';
    required: boolean;
    placeholder?: string;
    description?: string;
}

interface FieldBuilderProps {
    fields: Field[];
    onUpdate: (fields: Field[]) => void;
}

const FIELD_TYPES = [
    { id: 'text', label: 'Short Text', icon: Type },
    { id: 'url', label: 'URL / Link', icon: Link },
    { id: 'file', label: 'File Upload', icon: FileUp },
    { id: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { id: 'number', label: 'Number', icon: Hash },
];

const FieldBuilder: React.FC<FieldBuilderProps> = ({ fields, onUpdate }) => {
    const addField = (type: Field['type']) => {
        const newField: Field = {
            id: Math.random().toString(36).substr(2, 9),
            label: `New ${type} field`,
            type,
            required: true,
            placeholder: type === 'url' ? 'https://...' : ''
        };
        onUpdate([...fields, newField]);
    };

    const removeField = (id: string) => {
        onUpdate(fields.filter(f => f.id !== id));
    };

    const updateField = (id: string, updates: Partial<Field>) => {
        onUpdate(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                {FIELD_TYPES.map(type => (
                    <button
                        key={type.id}
                        onClick={() => addField(type.id as any)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-100 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                        <type.icon size={14} />
                        Add {type.label}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {fields.length === 0 ? (
                    <p className="text-xs text-emerald-600/50 italic text-center py-4">No fields added yet. Add some fields to collect data from participants.</p>
                ) : (
                    fields.map((field) => (
                        <div key={field.id} className="p-4 bg-white border border-emerald-100 rounded-2xl flex items-center gap-4 group">
                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500">
                                {FIELD_TYPES.find(t => t.id === field.type)?.icon && React.createElement(FIELD_TYPES.find(t => t.id === field.type)!.icon, { size: 16 })}
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                    type="text"
                                    value={field.label}
                                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                                    className="px-3 py-1.5 bg-slate-50 border border-transparent focus:border-emerald-200 rounded-lg outline-none text-sm font-bold text-slate-700"
                                    placeholder="Field Label (e.g. GitHub Repository)"
                                />
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="text"
                                        value={field.placeholder || ''}
                                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-transparent focus:border-emerald-200 rounded-lg outline-none text-xs"
                                        placeholder="Placeholder text"
                                    />
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={field.required}
                                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                            className="w-4 h-4 accent-emerald-500"
                                        />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Required</span>
                                    </label>
                                </div>
                            </div>

                            <button 
                                onClick={() => removeField(field.id)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FieldBuilder;

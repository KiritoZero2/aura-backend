const mongoose = require('mongoose');

const MovimientoSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    tipo: { type: String, enum: ['ingreso', 'gasto'], required: true },
    fecha: { type: String, required: true }, // YYYY-MM-DD, igual que en el frontend
    descripcion: { type: String, required: true, trim: true, maxlength: 200 },
    monto: { type: Number, required: true, min: 0 },
    categoria: { type: String, default: 'cat10' },
    notas: { type: String, default: '', maxlength: 500 },
    creado: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const CategoriaSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    icon: { type: String, default: '📦', maxlength: 10 },
    color: { type: String, default: '#64748b', maxlength: 20 },
  },
  { _id: false }
);

const PresupuestoSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    nombre: { type: String, required: true, trim: true, maxlength: 100 },
    categoria: { type: String, default: '' },
    limite: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const MetaSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    nombre: { type: String, required: true, trim: true, maxlength: 100 },
    objetivo: { type: Number, required: true, min: 0 },
    actual: { type: Number, default: 0, min: 0 },
    fecha: { type: String, default: '' },
    icon: { type: String, default: '🏆', maxlength: 10 },
    creado: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const DEFAULT_CATEGORIAS = [
  { id: 'cat1', name: 'Alimentación', icon: '🍔', color: '#f59e0b' },
  { id: 'cat2', name: 'Transporte', icon: '🚗', color: '#3b82f6' },
  { id: 'cat3', name: 'Salud', icon: '💊', color: '#10b981' },
  { id: 'cat4', name: 'Entretenimiento', icon: '🎮', color: '#8b5cf6' },
  { id: 'cat5', name: 'Vivienda', icon: '🏠', color: '#f43f5e' },
  { id: 'cat6', name: 'Ropa', icon: '👕', color: '#ec4899' },
  { id: 'cat7', name: 'Educación', icon: '📚', color: '#06b6d4' },
  { id: 'cat8', name: 'Salario', icon: '💼', color: '#10b981' },
  { id: 'cat9', name: 'Freelance', icon: '💻', color: '#8b5cf6' },
  { id: 'cat10', name: 'Otros', icon: '📦', color: '#64748b' },
];

const UserDataSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    movimientos: { type: [MovimientoSchema], default: [] },
    categorias: { type: [CategoriaSchema], default: DEFAULT_CATEGORIAS },
    presupuestos: { type: [PresupuestoSchema], default: [] },
    metas: { type: [MetaSchema], default: [] },
    usdRate: { type: Number, default: 4200 },
  },
  { timestamps: true }
);

UserDataSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    delete ret._id;
    delete ret.user;
    return ret;
  },
});

UserDataSchema.statics.DEFAULT_CATEGORIAS = DEFAULT_CATEGORIAS;

module.exports = mongoose.model('UserData', UserDataSchema);

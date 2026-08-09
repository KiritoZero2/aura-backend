const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ['sugerencia', 'bug'], required: true },
    titulo: { type: String, required: true, trim: true, maxlength: 120 },
    descripcion: { type: String, default: '', trim: true, maxlength: 1000 },
    estado: {
      type: String,
      enum: ['recibido', 'en_revision', 'planeado', 'en_progreso', 'completado', 'rechazado'],
      default: 'recibido',
    },
    votos: { type: Number, default: 1, min: 0 },
    // Guardamos el username de cada votante para no dejar votar 2 veces a la misma persona,
    // pero esto es visible para todos (feedback público), a diferencia de los datos financieros.
    votantes: { type: [String], default: [] },
    autor: { type: String, required: true },
  },
  { timestamps: true }
);

FeedbackSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.fecha = ret.createdAt;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Feedback', FeedbackSchema);

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/, // mismas reglas que ya validaba el frontend
      index: true,
    },
    // Solo guardamos el HASH, jamás la contraseña en texto plano
    passwordHash: {
      type: String,
      required: true,
      select: false, // nunca se devuelve por defecto en las consultas
    },
    since: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Nunca serializar el hash aunque alguien haga .toJSON() por error
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);

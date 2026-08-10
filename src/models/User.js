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
    // Foto de perfil guardada como data URL base64 (ya comprimida/recortada en el navegador
    // antes de subirla, así que el tamaño máximo esperado es pequeño, ~50-150KB).
    avatarUrl: {
      type: String,
      default: null,
      maxlength: 400000, // margen de sobra sobre lo que debería llegar ya comprimido
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

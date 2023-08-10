const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
  roomId: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .label("room id"),
  quiz: Joi.string()
    .trim()
    .required()
    .pattern(/^[a-zA-Z0-9/-]+$/, {
      name: 'quiz name'
    })
    .label("quiz")
});

const roomSchema = Joi.object({
  name: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
  quiz: Joi.string()
    .trim()
    .required()
    .pattern(/^[a-zA-Z0-9/-]+$/, {
      name: 'quiz name'
    })
    .label("quiz")
});

const loginSchema = Joi.object({
  sessionId: Joi.string()
    .trim()
    .alphanum()
    .required()
    .label("session id")
});

module.exports = {
  userSchema: userSchema,
  roomSchema: roomSchema,
  loginSchema: loginSchema
}
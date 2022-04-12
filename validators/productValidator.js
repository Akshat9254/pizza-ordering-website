const Joi = require('joi')

const productSchema = Joi.object({
    name : Joi.string().required(),
    price : Joi.number().required(),
    size : Joi.string().required(),
    size : Joi.string()
})

module.exports = productSchema
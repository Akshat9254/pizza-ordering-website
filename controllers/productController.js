const multer = require('multer')
const path = require('path')
const fs = require('fs')

const { Product } = require('../models')
const { CustomErrorHandler } = require('../services')
const { productSchema } = require('../validators')


const storage = multer.diskStorage({ 
    destination : (req, file, cb) => cb(null, 'uploads/') ,
    filename : (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`
        cb(null, uniqueName)
    } 
})

const handleMultipartData = multer({ storage, limits : { fileSize : 1024 * 1024 * 5 } }).single('image')

const productController = {
    async create(req, res, next) {
        handleMultipartData(req, res, async(err) => {
            if(err) {
                return next(CustomErrorHandler.serverError(err.message))
            }

            if(!req.file) {
                return next(CustomErrorHandler.serverError('File not found'))
            }

            const filePath = req.file.path

            // validate request
            const { error } = productSchema.validate(req.body)

            if(error) {
                // delete the uploaded file
                fs.unlink(`${appRoot}/${filePath}`, (err) => {
                    if(err) {
                        return next(CustomErrorHandler.serverError(err.message))
                    }
                })

                return next(error)
            }

            const { name, price, size } = req.body

            try {
                const document = await Product.create({
                    name,
                    price,
                    size,
                    image : filePath
                })

                res.status(201).json(document)
            } catch(err) {
                return next(err)
            }

            
        })
    },

    async update(req, res, next) {
        handleMultipartData(req, res, async(err) => {
            if(err) {
                return next(CustomErrorHandler.serverError(err.message))
            }

            let filePath

            if(req.file) {
                filePath = req.file.path
            }

            // validate request
            const { error } = productSchema.validate(req.body)

            if(error) {

                if(req.file) {
                    // delete the uploaded file
                    fs.unlink(`${appRoot}/${filePath}`, (err) => {
                        if(err) {
                            return next(CustomErrorHandler.serverError(err.message))
                        }
                    })
                }

                return next(error)
            }

            const { name, price, size } = req.body

            try {
                const document = await Product.findOneAndUpdate({ _id : req.params.id } ,{
                    name,
                    price,
                    size,
                    ...(req.file && { image : filePath })
                }, { new : true })

                res.status(201).json(document)
            } catch(err) {
                return next(err)
            }

            
        })
    },

    async delete(req, res, next) {
        const document = await Product.findByIdAndRemove({ _id : req.params.id })

        if(!document) {
            return next(new Error('Nothing to delete'))
        }

        // delete image
        const imagePath = document._doc.image
        fs.unlink(`${appRoot}/${imagePath}`, (err) => {
            if(err) {
                return next(CustomErrorHandler.serverError())
            }

            res.json(document)
        })
    },

    async index(req, res, next) {
        try {
            const products = await Product.find().select('-updatedAt -__v').sort({ createdAt : -1 })
            res.json(products)
        } catch(err) {
            next(err)
        }
    },

    async show(req, res, next) {
        try {
            const product = await Product.findOne({ _id : req.params.id }).select('-updatedAt -__v')

            res.json(product)
        } catch(err) {
            return next(CustomErrorHandler.serverError())
        }
    }
}

module.exports = productController
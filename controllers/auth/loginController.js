const Joi = require('joi')
const bcrypt = require('bcrypt')

const { User, RefreshToken } = require('../../models')
const { CustomErrorHandler, JwtService } = require('../../services')
const { REFRESH_SECRET } = require('../../config')

const loginController = {
    async login(req, res, next) {
        // validate request
        const loginSchema = Joi.object({
            email : Joi.string().email().required(),
            password : Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required()
        })

        const { error } = loginSchema.validate(req.body)

        if(error) {
            return next(error)
        }


        try {
            const user = await User.findOne({ email : req.body.email })

            if(!user) {
                return next(CustomErrorHandler.wrongCredentails())
            }

            // compare password
            const match = await bcrypt.compare(req.body.password, user.password)
            if(!match) {
                return next(CustomErrorHandler.wrongCredentails())
            }

            // sign token
            const access_token = JwtService.sign({ _id : user._id, role : user.role })
            const refresh_token = JwtService.sign({ _id : user._id, role : user.role }, '1y', REFRESH_SECRET)

            // database whitelist
            await RefreshToken.create({ token : refresh_token })

            res.json({ message : 'User logged in successfully.', access_token, refresh_token })

        } catch(err) {
            return next(err)
        }
    },

    async logout(req, res, next) {
        // validate request
        const refreshSchema = Joi.object({
            refresh_token : Joi.string().required()
        })

        const { error } = refreshSchema.validate(req.body)

        if(error) {
            return next(error)
        }

        try {
            await RefreshToken.deleteOne({ token : req.body.refresh_token })

            res.json({ message : 'User logged out.' })
        } catch(err) {
            return next(err)
        }
    }
}

module.exports = loginController
const Joi = require('joi')
const bcrypt = require('bcrypt')

const { CustomErrorHandler, JwtService } = require('../../services')
const { User, RefreshToken } = require('../../models')
const { REFRESH_SECRET } = require('../../config')



const registerController = {
    async register(req, res, next) {
        // validation
        const registerSchema = Joi.object({
            name : Joi.string().min(3).max(30).required(),
            email : Joi.string().email().required(),
            password : Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
            repeat_password : Joi.ref('password')
        })

        const { error } = registerSchema.validate(req.body)

        if(error) {
            return next(error)
        }


        // check if user already exist in db
        try {
            const exist = await User.exists({ email : req.body.email})
            if(exist) {
                return next(CustomErrorHandler.alreadyExist('This email is already taken.'))
            }
        } catch(err) {
            return next(err)
        }

        const { name, email, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = new User({
            name, 
            email,
            password : hashedPassword
        })


        try {
            const result = await user.save()

            // sign tokens
            const access_token =  JwtService.sign({ _id : result._id, role : result.role })
            const refresh_token = JwtService.sign({ _id : result._id, role : result.role }, '1y', REFRESH_SECRET)

            // database whitelist
            await RefreshToken.create({ token : refresh_token })

            res.json({ message : "User registered successfully.", access_token, refresh_token })
        } catch(err) {
            return next(err)
        }

        
    }
}

module.exports = registerController
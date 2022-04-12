const Joi = require('joi')
const { RefreshToken, User } = require('../../models')
const { CustomErrorHandler, JwtService } = require('../../services')
const { REFRESH_SECRET } = require('../../config')

const refreshController = {
    async refresh(req, res, next) {
        // validate request
        const refreshSchema = Joi.object({
            refresh_token : Joi.string().required()
        })

        const { error } = refreshSchema.validate(req.body)

        if(error) {
            return next(error)
        }


        // check if refresh_token is whitelist (exists in db)
        let refresh_token
        try {
            refresh_token =  await RefreshToken.findOne({ token : req.body.refresh_token })

            if(!refresh_token) {
                return next(CustomErrorHandler.unAuthorized('Invalid refresh token'))
            }

            let userId

            try {
                const { _id } = JwtService.verify(refresh_token.token, REFRESH_SECRET)
                userId = _id
            } catch(err) {
                return next(CustomErrorHandler.unAuthorized('Invalid refresh token'))
            }


            // fectch user from db
            const user = await User.findOne({ _id : userId })

            if(!user) {
                return next(CustomErrorHandler.unAuthorized('No user found'))
            }

            // sign tokens
            const access_token =  JwtService.sign({ _id : user._id, role : user.role })
            refresh_token = JwtService.sign({ _id : user._id, role : user.role }, '1y', REFRESH_SECRET)

            // database whitelist
            await RefreshToken.create({ token : refresh_token })

            res.json({ message : "Tokens generated successfully.", access_token, refresh_token })

        } catch(err) {
            return next(err)
        }
    }
}

module.exports = refreshController
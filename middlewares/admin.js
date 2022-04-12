const { User } = require('../models')
const { CustomErrorHandler } = require('../services')

const admin = async(req, res, next) => {
    try {
        const user = await User.findOne({ _id : req.user._id })
        
        if(user.role !== 'admin') {
            return next(CustomErrorHandler.unAuthorized())
        } else {
            next()
        }

    } catch(err) {
        return next(CustomErrorHandler.serverError())
    }
}

module.exports = admin
const express = require('express')
const router = express.Router()

const { registerController, loginController, userController, refreshController, productController } = require('../controllers')
const { auth, admin } = require('../middlewares')

router.post('/register', registerController.register)
router.post('/login', loginController.login)
router.get('/me', auth, userController.me)
router.post('/refresh', refreshController.refresh)
router.post('/logout', auth, loginController.logout)

router.post('/product', productController.create)
router.put('/product/:id', [auth, admin], productController.update)
router.delete('/product/:id', [auth, admin], productController.delete)
router.get('/product/', productController.index)
router.get('/product/:id', productController.show)

module.exports = router
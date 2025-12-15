'use client'

import { useState } from 'react'
import { loginAndRedirect, crearUsuario } from '@/app/actions/users'

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nombre: '',
        rol: 'cliente',
    })

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setMessage(null)

        try {
            if (isLogin) {
                // loginAndRedirect lanzará un redirect si es exitoso
                // Si hay error, lo devuelve
                const result = await loginAndRedirect({
                    email: formData.email,
                    password: formData.password,
                })

                // Solo llegamos aquí si hubo un error
                if ('error' in result && result.error) {
                    setMessage({ type: 'error', text: result.error })
                    setIsLoading(false)
                }
                // Si fue exitoso, el redirect ya ocurrió y este código no se ejecuta
            } else {
                const result = await crearUsuario({
                    email: formData.email,
                    password: formData.password,
                    nombre: formData.nombre,
                    rol: formData.rol,
                })

                if ('error' in result && result.error) {
                    setMessage({ type: 'error', text: result.error })
                } else {
                    setMessage({ type: 'success', text: result.mensaje || 'Usuario creado exitosamente' })
                    setTimeout(() => {
                        setIsLogin(true)
                        setFormData({ ...formData, password: '' })
                    }, 1500)
                }
                setIsLoading(false)
            }
        } catch {
            setMessage({ type: 'error', text: 'Error inesperado' })
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold mb-2 text-center text-gray-900">
                    Ticket System
                </h1>
                <p className="text-center text-gray-600 mb-6">
                    {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea una nueva cuenta'}
                </p>

                {message && (
                    <div
                        className={`p-4 mb-6 rounded ${message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required={!isLogin}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Tu nombre"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••••"
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                            <select
                                name="rol"
                                value={formData.rol}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="cliente">Cliente</option>
                                <option value="operador">Operador</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                    >
                        {isLoading ? (isLogin ? 'Iniciando...' : 'Creando...') : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin)
                                setMessage(null)
                                setFormData({
                                    email: '',
                                    password: '',
                                    nombre: '',
                                    rol: 'cliente',
                                })
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            {isLogin ? 'Regístrate' : 'Inicia sesión'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

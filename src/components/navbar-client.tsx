'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logoutUsuario } from '@/app/actions/users'

interface SessionUser {
    id: number
    email: string
    nombre: string
    rol: 'cliente' | 'operador' | 'admin'
}

interface NavbarClientProps {
    user: SessionUser
}

export function NavbarClient({ user }: NavbarClientProps) {
    const router = useRouter()
    const [showDropdown, setShowDropdown] = useState(false)

    const handleLogout = async () => {
        try {
            await logoutUsuario()
            setShowDropdown(false)
            router.push('/')
            router.refresh()
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

    const getRoleBadge = (rol: string) => {
        switch (rol) {
            case 'admin':
                return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Admin</span>
            case 'operador':
                return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Operador</span>
            default:
                return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Cliente</span>
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {user.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900">{user.nombre}</p>
                            <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                            <div className="mt-2">
                                {getRoleBadge(user.rol)}
                            </div>
                        </div>
                        <div className="py-1">
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

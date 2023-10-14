import { useEffect } from 'react'
import useSWR from 'swr'
import { useNavigate } from 'react-router-dom'
import clienteAxios from "../config/axios"

export const useAuth = ({ middleware, url }) => {

    const token = localStorage.getItem('AUTH_TOKEN')
    const navigate = useNavigate();

    const { data: user, error, mutate } = useSWR('/api/user', () =>
        clienteAxios('/api/user', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(res => res.data)
            .catch(error => {
                throw Error(error?.response?.data?.errors)
            })
    )

    const login = async (datos, setErrores) => {

        try {
            const { data } = await clienteAxios.post('/api/login', datos)
            localStorage.setItem('AUTH_TOKEN', data.token)
            setErrores([])
            await mutate()
        } catch (error) {
            setErrores(Object.values(error.response.data.errors))
        }

    }

    const registro = async (datos, setErrores) => {
        try {
            const { data } = await clienteAxios.post('/api/registro', datos)
            localStorage.setItem('AUTH_TOKEN', data.token);
            setErrores([])
            await mutate()
        } catch (error) {
            setErrores(Object.values(error.response.data.errors))
        }
    }

    const logout = async () => {
        try {
            await clienteAxios.post('/api/logout', null, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            localStorage.removeItem('AUTH_TOKEN')
            await mutate(undefined)
        } catch (error) {
            throw Error(error?.response?.data?.errors)
        }
    }

    useEffect(() => {
        if (middleware === 'guest' && url && user) {
            navigate(url)
        }
        if (middleware === 'auth' && error) {
            navigate('/auth/login')
        }
        //si el usuario no es un admin
        if (middleware === 'guest' && user && user.admin) {
            navigate('/admin')
        }

        //si el usuario normal quiere acceder a contenido de admin
        if (middleware === 'admin' && user && !user.admin) {
            navigate('/')
        }

    }, [user, error])

    return {
        login,
        registro,
        logout,
        user,
        error
    }

}
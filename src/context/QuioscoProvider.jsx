import { createContext, useState, useEffect } from "react"
import { toast } from "react-toastify";
import clienteAxios from "../config/axios";

const QuioscoContext = createContext();

const QuioscoProvider = ({ children }) => {

    const [categorias, setCategorias] = useState([])

    const [categoriaActual, setCategoriaActual] = useState({})

    const [modal, setModal] = useState(false)

    const [producto, setProducto] = useState({})

    const [pedido, setPedido] = useState([])

    const [total, setTotal] = useState(0)

    useEffect(() => {
        const nuevoTotal = pedido.reduce((total, producto) => (producto.precio * producto.cantidad) + total, 0)
        setTotal(nuevoTotal)
    }, [pedido])

    const obtenerCategorias = async () => {
        const token = localStorage.getItem('AUTH_TOKEN')
        try {
            const { data } = await clienteAxios('/api/categorias', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setCategorias(data.data)
            setCategoriaActual(data.data[0])
        } catch (error) {
            console.log(error)
        }
    }

    //cargamos las categorias apenas se cargue el componente
    useEffect(() => {
        obtenerCategorias();
    }, [])

    const handleClickCategoria = id => {
        const categoria = categorias.filter(categoria => categoria.id === id)[0]
        setCategoriaActual(categoria)
    }

    const handleClickModal = () => {
        setModal(!modal)
    }

    const handleSetProducto = producto => {
        setProducto(producto)
    }


    //mandamos los datos del producto, pero no enviamos la categoria ni la imagen
    const handleAgregarPedido = ({ categoria_id, ...producto }) => {

        if (pedido.some(pedidoState => pedidoState.id === producto.id)) {
            //buscamos dentro del arreglo de pedidos, si el pedido ya ha sido agregado anteriormente
            const pedidoActualizado = pedido.map(pedidoState => pedidoState.id === producto.id
                ? producto : pedidoState)
            setPedido(pedidoActualizado)
            toast.success('Guardado Correctamente')
        } else {
            //si no se ha agregado previamente, se agrega
            setPedido([...pedido, producto])
            toast.success('Agregado al Pedido')
        }

    }

    const handleEditarCantidad = id => {
        const productoActualizar = pedido.filter(producto => producto.id === id)[0]
        setProducto(productoActualizar)
        setModal(!modal)
    }

    //para eliminar un pedido, filtramos todos los productos que sean diferente al producto que se quiera eliminar, y sobreescribimos el state
    const handleEliminarProductoPedido = id => {
        const pedidoActualizado = pedido.filter(producto => producto.id != id)
        setPedido(pedidoActualizado)
        toast.success('Eliminado del Pedido')
    }


//para agregar un nuevo pedido
    const handleSubmitNuevaOrden = async (logout) => {

        const token = localStorage.getItem('AUTH_TOKEN')

        try {
            const { data } = await clienteAxios.post('/api/pedidos',
                {
                    //se pasa el total al backend en PedidoController
                    total,
                    //pasamos los productos del pedido, se renombra el arreglo del useState para darle congruencia en el backend
                    productos: pedido.map(producto => {
                        return {
                            id: producto.id,
                            cantidad: producto.cantidad
                        }
                    })
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

            //en caso de que el backend retorne mensaje correcto mostrar confirmación del pedido
            toast.success(data.message);

            //reiniciamos el arreglo del pedido
            setTimeout(() => {
                setPedido([])
            }, 1000);

            //cerrar la sesión del usuario luego de hacer el pedido
            setTimeout(() => {
                localStorage.removeItem('AUTH_TOKEN');
                logout();
            }, 3000);

        } catch (error) {
            console.log(error)
        }
    }


//para atender o completar un pedido
    const handleClickCompletarPedido = async id => {
        const token = localStorage.getItem('AUTH_TOKEN')

        try {
            //mandamos el update directamente a PedidoController.
            await clienteAxios.put(`/api/pedidos/${id}`, null,{
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
        } catch (error) {
            console.log(error)
        }
    }


    //para marcar un producto como agotado
    const handleClickProductoAgotado = async id => {
        const token = localStorage.getItem('AUTH_TOKEN')

        try {
            //mandamos el update directamente a PedidoController.
            await clienteAxios.put(`/api/productos/${id}`, null,{
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
        } catch (error) {
            console.log(error)
        }
    }


    return (

        <QuioscoContext.Provider
            value={{
                categorias,
                categoriaActual,
                handleClickCategoria,
                modal,
                handleClickModal,
                producto,
                handleSetProducto,
                pedido,
                handleAgregarPedido,
                handleEditarCantidad,
                handleEliminarProductoPedido,
                total,
                handleSubmitNuevaOrden,
                handleClickCompletarPedido,
                handleClickProductoAgotado
            }}
        >{children}</QuioscoContext.Provider>

    )
}

export {
    QuioscoProvider
}

export default QuioscoContext
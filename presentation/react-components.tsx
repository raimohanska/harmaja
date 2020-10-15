type Args = { asdf: string, qwer: string, zxcv: string }
function useState(x : string): any {}
function useEffect(f: (...args: any[]) => any, deps: any[] ) {}


export const SimpleComponent = ({  qwer  } : Args) => {
    
    return <div>
        <div>
            <span>{   qwer   }</span>
        </div>
    </div>
}

export const Component = ({  qwer  } : Args) => {
    
    const [ zxcv ] = useState(  "LOL"  )

    return <div>
        <span>{   zxcv   }</span>
        <div>
            <span>{   qwer   }</span>
        </div>
    </div>
}


export const Component2 = ({  asdf,   qwer  } : Args) => {
    
    const [  zxcv,  setIt  ] = useState(  "LOL"  )

    useEffect(() => {                   },   [asdf])

    return <div>
        <span>{   zxcv   }</span>
        <div>
            <span>{   qwer   }</span>
        </div>
    </div>
}

function flatMap(asdf: string, fn: Function): any {}

export const Component3 = ({  asdf,   qwer  } : Args) => {
    
    const   zxcv   = flatMap(  asdf  , ( a ) => { })

    return <div>
        <span>{   zxcv   }</span>
        <div>
            <span>{   qwer   }</span>
        </div>
    </div>
}

type User = any
type Product = any
type ShoppingCart = any

type AppState = {
    user: User,
    products: Product[],
    cart: ShoppingCart
}

type Login = any
type UpdateProductList = any
type AddToCart = any

type AppEvent = Login | UpdateProductList | AddToCart 
type AppReducer = (s: AppState, e: AppEvent) => AppState
type Listener = (e: AppEvent) => void
type Store = {
    dispatch(e: AppEvent);
    getState(): AppState;
    subscribe(l: Listener);
}
type Selector<A, B> = (state: A) => B

const justUser = (state: AppState) => state.user

type Asdf = AppReducer
type Qwer = Store
const a = justUser

import Chatlist from './chatList/Chatlist'
import './List.css'
import Userinfo from './userInfo/userInfo'

function List() {
  return (
    <div className='list'>
<Userinfo/>
<Chatlist/>
    </div>
  )
}

export default List

import { auth } from '../../libray/firebase'
import { useUserStore } from '../../libray/userStore'
import './Details.css'


const Details = () => {
  const { setLoading, setCurrentUser } = useUserStore()

  const handleLogout = () => {
    auth.signOut() 
     .then(() => {
        setCurrentUser(null),
        setLoading(false)
    }).catch((error) => {
      console.error('Sign out error', error)
    })
  }

  return (
    <div className='details'>
      Details
      <div className="user">
        <img src="public/avatar.png" alt="" />
        <h2>James Martin</h2>
        <p>Lorem ipsum dolor sit</p>
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Privacy and Help</span>
            <img src="public/arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared photos</span>
            <img src="public/arrowDown.png" alt="" />
          </div>
        </div>
        <div className="photos">
          <div className="photoItem">
            <div className="photoDetails">
              <img src="public/AdobeStock_500408234.jpeg" alt="" />
              <span>photo34-43.png</span>
            </div>
            <div className="icon">
              <img src="public/download.png" alt="" />
            </div>
          </div>
          <div className="photoItem">
            <div className="photoDetails">
              <img src="public/AdobeStock_500408234.jpeg" alt="" />
              <span>photo34-43.png</span>
            </div>
            <div className="icon">
              <img src="public/download.png" alt="" />
            </div>
          </div>
          <div className="photoItem">
            <div className="photoDetails">
              <img src="public/AdobeStock_500408234.jpeg" alt="" />
              <span>photo34-43.png</span>
            </div>
            <div className="icon">
              <img src="public/download.png" alt="" />
            </div>
          </div>
          <div className="photoItem">
            <div className="photoDetails">
              <img src="public/AdobeStock_500408234.jpeg" alt="" />
              <span>photo34-43.png</span>
            </div>
            <div className="icon">
              <img src="public/download.png" alt="" />
            </div>
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <img src="public/arrowUp.png" alt="" />
          </div>
        </div>
        <button>Block User</button>
        <button className='logout' onClick={handleLogout}>Logout</button>
      </div>
    </div>
  )
}

export default Details

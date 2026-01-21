import { useRef, useState, useEffect } from 'react';
//引入axios
import axios from 'axios';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // import bootstrap
const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

//引入style.css
import './assets/style.css';
function App() {
  //建立新增產品相關Modal useRef
  let myModal = useRef();
  const modalRef = useRef();
  const [isAuth, setAuth] = useState(false); // 登入狀態
  // 表單資料狀態(儲存登入表單輸入)
  const [formData, setFormData] = useState({
    username: 'hoganalin@gmail.com',
    password: '049xcdqazq',
  });
  const [products, setProducts] = useState([]); //產品列表
  // const [tempProduct, setTempProduct] = useState(); //被選中的產品

  //處理modal
  useEffect(() => {
    myModal.current = new bootstrap.Modal(modalRef.current);
  }, []);
  const openModal = () => {
    myModal.current.show();
  };
  const onLogin = async (e) => {
    try {
      e.preventDefault();
      const res = await axios.post(`${API_BASE}/admin/signin`, formData);
      const { token, expired } = res.data;
      // 設定 cookie
      document.cookie = `hexToken=${token};expires=${new Date(expired * 1000)};`;
      // 設定 axios 預設 header
      axios.defaults.headers.common['Authorization'] = token;
      getProduct(); //取的產品列表
      setAuth(true); // 切換登入狀態為 true
    } catch (error) {
      setAuth(false); // 切換登入狀態為 false
      console.log('error', error.response?.data.message);
    }
  };

  //取得產品資訊
  const getProduct = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products`);
      setProducts(res.data.products);
    } catch (error) {
      console.log(error.response);
    }
  };

  function eventHandler(e) {
    const { value, name } = e.target;
    setFormData({ ...formData, [name]: value });
  }
  return (
    <>
      {!isAuth ? (
        <div className="container login">
          <h1>請先登入</h1>
          <form className="form-floating" onSubmit={(e) => onLogin(e)}>
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                name="username"
                placeholder="name@example.com"
                value={formData.username}
                onChange={(e) => {
                  eventHandler(e);
                }}
              />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input
                type="password"
                className="form-control"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => {
                  eventHandler(e);
                }}
              />
              <label htmlFor="password">Password</label>
              <button className="btn btn-primary mt-3 w-100" type="submit">
                登入
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <div className="container">
            <div className="text-end mt-4">
              <button className="btn btn-primary" onClick={openModal}>
                建立新的產品
              </button>
              <div className="modal" tabIndex="-1" ref={modalRef}>
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Modal title</h5>
                      <button
                        type="button"
                        className="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p>Modal body text goes here.</p>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        data-bs-dismiss="modal"
                      >
                        Close
                      </button>
                      <button type="button" className="btn btn-primary">
                        Save changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <table className="table mt-4">
              <thead>
                <tr>
                  <th width="120">分類</th>
                  <th>產品名稱</th>
                  <th width="120">原價</th>
                  <th width="120">售價</th>
                  <th width="100">是否啟用</th>
                  <th width="120">編輯</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr key={item.id}>
                    <td>{item.category}</td>
                    <td>{item.title}</td>
                    <td className="text-end">{item.origin_price}</td>
                    <td className="text-end">{item.price}</td>
                    <td>
                      <span className="text-success">啟用</span>
                      <span>未啟用</span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
// <div>
//         <input type="email" id='email' name='username' onChange={(e) =>
//           eventHandler(e)
//         }/>
//         <input type="password" id='password' name='password' onChange={(e) =>，
//           eventHandler(e)
//         }/>
//         <button type='button' id="login" onClick={() => login()}>登入</button>
//       </div>
//       <div>
//         <button type='button' id="check">確認是否登入</button>
//         <button type='button' id="getProducts">取得後台的產品列表</button>
//       </div>

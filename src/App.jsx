import axios from 'axios';
import { useRef, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;
//宣告modal儲存的資料
const INITIAL_TEMPLATE_DATA = {
  id: '',
  title: '',
  category: '',
  origin_price: '',
  price: '',
  unit: '',
  description: '',
  content: '',
  is_enabled: false,
  imageUrl: '',
  imagesUrl: [''],
};
//載入Bootstrap 的js/css
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import * as bootstrap from 'bootstrap';
//import style
import './assets/style.css';

function App() {
  const [isAuth, setIsAuth] = useState(false); // 登入狀態
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [products, setProducts] = useState([]); //產品列data
  const [modalType, setModalType] = useState(''); //設定modal要做什麼? 新增 or 編輯
  const [templateProduct, setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA); //單一產品DATA儲存格式
  const productModalRef = useRef(null);
  const myModal = useRef(null);

  //取得產品們的資料
  const getData = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/${API_PATH}/products/all`
      );
      console.log('產品列表載入成功', response.data.products);
      setProducts(response.data.products);
    } catch (error) {
      console.log(`取得產品資料錯誤`, error.response?.data?.message);
    }
  };
  //更新產品資料 (新增或者編輯)
  const updateProductData = async (id) => {
    //決定api端點跟方法
    let url = `${API_BASE}/api/${API_PATH}/admin/product`;
    let method = 'post'; //這是api新增的方法
    if (modalType === 'edit') {
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`;
      method = 'put'; // 改成api編輯的方法
    }
    const productData = {
      data: {
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        imagesUrl: [...templateProduct.imagesUrl.filter((url) => url !== '')],
      },
    };
    try {
      const response = await axios[method](url, productData);
      console.log(response.data);
      getData(); //重新更新產品列表
      closeModal(); //關閉modal
    } catch (error) {
      (console.log('更新產品資料錯誤'), error.response);
    }
  };
  //刪除產品資料
  const deleteProduct = async (id) => {
    try {
      const response = await axios.delete(
        `${API_BASE}/api/${API_PATH}/admin/product/${id}`
      );
      console.log(response.data);
      getData();
      closeModal();
    } catch (error) {
      console.log('刪除產品資料錯誤', error.response);
    }
  };
  //處理表單填值
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  //處理副圖的url
  const handleImageChange = (index, value) => {
    setTemplateProduct((prevData) => {
      const newImages = [...prevData.imagesUrl];
      newImages[index] = value;

      // 填寫最後一個空輸入框時，自動新增空白輸入框
      if (
        value !== '' &&
        index === newImages.length - 1 &&
        newImages.length < 5
      ) {
        newImages.push('');
      }

      // 清空輸入框時，移除最後的空白輸入框
      if (
        value === '' &&
        newImages.length > 1 &&
        newImages[newImages.length - 1] === ''
      ) {
        newImages.pop();
      }

      return { ...prevData, imagesUrl: newImages };
    });
  };

  //新增附圖
  const handleAddImage = () => {
    setTemplateProduct((prevData) => {
      const newImages = [...prevData.imagesUrl]; //複製圖片陣列
      newImages.push('');
      //處理特定索引值的圖片網址
      return { ...prevData, imagesUrl: newImages }; //回傳陣列, 把imagesUrl更新
    });
  };
  //刪除附圖
  const handleRemoveImage = () => {
    setTemplateProduct((prevData) => {
      const newImages = [...prevData.imagesUrl]; //複製圖片陣列
      newImages.pop();
      return { ...prevData, imagesUrl: newImages }; //回傳陣列, 把imagesUrl更新
    });
  };
  //宣告modal 的欄位綁定值
  const modalHandleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setTemplateProduct((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  const handleSubmit = async (e) => {
    //處理提交表單
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE}/admin/signin`, formData);
      console.log(response.data);
      const { token, expired } = response.data;
      //儲存token到cookie
      document.cookie = `myToken=${token};expires=${new Date(expired)}`;
      //設定axios的預設headers
      axios.defaults.headers.common.Authorization = `${token}`;
      //載入產品資料
      getData();
      //更新登入狀態為true
      setIsAuth(true);
    } catch (error) {
      console.log('提交表單出錯了,error為', error);
    }
  };
  //檢查登入狀態, 之後初始化都可以先確認一次(使用useEffect,就不需要每次登入頁面都要重新登入)

  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('myToken='))
      ?.split('=')[1];
    console.log('目前token', token);
    if (!token) return;

    axios.defaults.headers.common.Authorization = token;

    const checkLogin = async () => {
      try {
        const res = await axios.post(`${API_BASE}/api/user/check`);
        console.log(res);
        setIsAuth(true);
        getData();
      } catch (error) {
        console.log('登入驗證失敗', error.response);
      }
    };
    checkLogin();
  }, []);
  //宣告input的值綁定欄位方式

  //綁定Modal useRef
  useEffect(() => {
    if (!isAuth) return;
    if (!productModalRef.current) return;

    if (!myModal.current) {
      myModal.current = new bootstrap.Modal(productModalRef.current, {
        backdrop: true,
        keyboard: false,
      });
    }
  }, [isAuth]);

  //打開modal方式
  const openModal = (type, product) => {
    // console.log(product);
    setModalType(type);
    setTemplateProduct((pre) => ({ ...pre, ...product }));
    myModal.current.show();
  };
  //關閉modal方式
  const closeModal = () => {
    myModal.current.hide();
  };
  return isAuth ? (
    <div className="container">
      <div className="text-end mt-4">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            openModal('create', INITIAL_TEMPLATE_DATA);
          }}
        >
          建立新的產品
        </button>
      </div>

      <h2 className="mt-1">刪除列表</h2>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">分類</th>
            <th scope="col">產品名稱</th>
            <th scope="col">原價</th>
            <th scope="col">售價</th>
            <th scope="col">是否啟用</th>
            <th scope="col">編輯</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <th scope="row">{product.category}</th>
              <td>{product.title}</td>
              <td>{product.origin_price}</td>
              <td>{product.price}</td>
              <td className={`${product.is_enabled ? 'text-success' : ''}`}>
                {product.is_enabled ? '啟用' : '未啟用'}
              </td>
              <td>
                <div
                  className="btn-group"
                  role="group"
                  aria-label="Basic example"
                >
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => {
                      openModal('edit', product);
                    }}
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => {
                      openModal('delete', product);
                    }}
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* <!-- Modal --> */}
      <div
        className="modal fade"
        id="productModal"
        tabIndex="-1"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
        ref={productModalRef}
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div
              className={`modal-header bg-${modalType === 'delete' ? 'danger' : 'dark'} text-white`}
            >
              <h1
                className="modal-title fs-5 text-white fw-bold"
                id="productModalLabel"
              >
                {modalType === 'delete'
                  ? '刪除'
                  : modalType === 'edit'
                    ? '編輯'
                    : '新增'}
                產品
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  closeModal();
                }}
              ></button>
            </div>
            <div className="modal-body">
              {modalType === 'delete' ? (
                <p className="text-danger">
                  是否真的要刪除{templateProduct.title}
                </p>
              ) : (
                <div className="row">
                  <div className="col-sm-4">
                    <div className="mb-2">
                      <div className="mb-3">
                        <label htmlFor="imageUrl" className="form-label">
                          輸入圖片網址
                        </label>
                        <input
                          type="text"
                          id="imageUrl"
                          name="imageUrl"
                          className="form-control"
                          placeholder="請輸入圖片連結"
                          value={templateProduct.imageUrl}
                          onChange={(e) => modalHandleInputChange(e)}
                        />
                      </div>
                      {templateProduct.imageUrl && (
                        <img
                          src={templateProduct.imageUrl}
                          className="img-fluid"
                          alt="主圖"
                        />
                      )}
                    </div>
                    {templateProduct.imagesUrl.map((url, index) => (
                      <div key={index}>
                        <label htmlFor="imgUrl" className="form-label">
                          輸入圖片網址
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          onChange={(e) =>
                            handleImageChange(index, e.target.value)
                          }
                          placeholder={`圖片網址${index + 1}`}
                          value={url}
                        />
                        {url && (
                          <img src={url} className="img-fluid" alt="副圖" />
                        )}
                      </div>
                    ))}
                    {templateProduct.imagesUrl.length < 5 &&
                      templateProduct.imagesUrl[
                        templateProduct.imagesUrl.length - 1
                      ] !== '' && (
                        <button
                          className="btn btn-outline-primary btn-sm d-block w-100"
                          onClick={handleAddImage}
                        >
                          新增圖片
                        </button>
                      )}
                    {templateProduct.imagesUrl.length > 1 && (
                      <button
                        className="btn btn-outline-danger btn-sm d-block w-100"
                        onClick={handleRemoveImage}
                      >
                        刪除圖片
                      </button>
                    )}
                  </div>
                  <div className="col-sm-8">
                    <div className="row">
                      <div className="mb-3">
                        <label htmlFor="title" className="form-label">
                          標題
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          className="form-control"
                          placeholder="請輸入標題"
                          value={templateProduct.title}
                          onChange={(e) => modalHandleInputChange(e)}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="category" className="form-label">
                          分類
                        </label>
                        <input
                          type="text"
                          id="category"
                          name="category"
                          className="form-control"
                          placeholder="分類"
                          value={templateProduct.category}
                          onChange={(e) => modalHandleInputChange(e)}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="unit" className="form-label">
                          單位
                        </label>
                        <input
                          type="text"
                          id="unit"
                          name="unit"
                          className="form-control"
                          placeholder="單位"
                          value={templateProduct.unit}
                          onChange={(e) => modalHandleInputChange(e)}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="origin_price" className="form-label">
                          原價
                        </label>
                        <input
                          type="text"
                          id="origin_price"
                          name="origin_price"
                          className="form-control"
                          placeholder="原價"
                          value={templateProduct.origin_price}
                          onChange={(e) => modalHandleInputChange(e)}
                        />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="price" className="form-label">
                          售價
                        </label>
                        <input
                          type="text"
                          id="price"
                          name="price"
                          className="form-control"
                          placeholder="售價"
                          value={templateProduct.price}
                          onChange={(e) => modalHandleInputChange(e)}
                        />
                      </div>
                    </div>
                    <hr />

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">
                        產品描述
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        className="form-control"
                        placeholder="請輸入產品描述"
                        value={templateProduct.description}
                        onChange={(e) => modalHandleInputChange(e)}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">
                        說明內容
                      </label>
                      <textarea
                        name="content"
                        id="content"
                        className="form-control"
                        placeholder="請輸入說明內容"
                        value={templateProduct.content}
                        onChange={(e) => modalHandleInputChange(e)}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          name="is_enabled"
                          id="is_enabled"
                          className="form-check-input"
                          type="checkbox"
                          checked={templateProduct.is_enabled}
                          onChange={(e) => modalHandleInputChange(e)}
                        />
                        <label
                          className="form-check-label "
                          htmlFor="is_enabled"
                        >
                          是否啟用
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {modalType === 'delete' ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    deleteProduct(templateProduct.id);
                  }}
                >
                  刪除
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    data-bs-dismiss="modal"
                    onClick={() => closeModal()}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => updateProductData(templateProduct.id)}
                  >
                    確認
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="container min-vh-100 d-flex justify-content-center align-items-center">
      <div className="w-100" style={{ maxWidth: '500px' }}>
        <form action="" onSubmit={handleSubmit}>
          <h1>請先登入</h1>
          <div className="form-floating mb-3 ">
            <input
              type="email"
              className="form-control"
              id="floatingInput"
              placeholder="name@example.com"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
            />
            <label htmlFor="floatingInput">Email address</label>
          </div>
          <div className="form-floating mb-3">
            <input
              type="password"
              className="form-control"
              id="floatingPassword"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
            />
            <label htmlFor="floatingPassword">Password</label>
          </div>
          <button className="btn btn-primary" type="submit">
            登入
          </button>
        </form>
      </div>
    </div>
  );
}
export default App;

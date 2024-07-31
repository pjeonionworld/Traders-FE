import React, { useState, useEffect } from 'react';
import main from '../pages/Main.module.css';
// import Calendar2 from '../components/Calendar2';
import Calendar from '../components/Calendar';
import axios from 'axios';
import { format } from 'date-fns';
// import { useSearchParams } from 'react-router-dom';
// import ExpiringProducts from '../components/ExpiringProducts';


function Main() {

  // const [date, setDate] = useState(new Date());
  const [goods, setGoods] = useState([]);
  const [searchGoods, setSearchGoods] = useState('');
  const [stock, setStock] = useState([]);
  const [stockk, setStockk] = useState([]); // 재고부족 상품 상태
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [selectedGoods, setSelectedGoods] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8090/traders/home')
      .then(response => {
        setGoods(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the goods!', error);
      });

      // 재고부족 상품 리스트 조회
      axios.get('http://localhost:8090/traders/stock')
      .then(response => {
        const shortage = response.data.filter(stock => stock.stockquantity <= 10).sort((a, b) => a.stockquantity - b.stockquantity);
        setStockk(shortage);
      })
      .catch(error => {
        console.error('There was an error fetching the goods!', error);
      });
  }, []);



  const handleSearch = (event) => {
    event.preventDefault();
    axios.get(`http://localhost:8090/traders/home/${searchGoods}`)
      .then(response => {
        setGoods(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the goods!', error);
      });
  };

  const handleDateSelect = (selectedDate) => {
    // 날짜가 어떤 형식으로 들어오는지 검증
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    console.log("Formatted date for API:", formattedDate);
    axios.get(`http://localhost:8090/traders/stock?date=${formattedDate}`)
    // axios.get(`http://localhost:8090/traders/stock?date=${format(selectedDate, 'yyyy-MM-dd')}`)
      .then(response => {
        //data가 들어오는지 검증
        console.log("API:", response.data);

        // 선택된 날짜로부터 7일 이내에 유통기한이 끝나는 상품만 필터링
        const expiringProducts = response.data.filter(stock => {
          // console.log("date변환전 : " + JSON.stringify(stock)); 
          // stock을 콘솔로 찍었을때 object라고만 떠서 JSON.stringify로 문자열로 변환후 데이터를 확인

          console.log("date변환전 : " + stock.expdate);
          // stock에 날짜가 expdate로 들어오고 있었음

          //날짜 변환
          // const expirationDate = stock.expdate;
          const expirationDate = new Date(stock.expdate); //유통기한
          console.log("test:" + expirationDate);

          const daysDifference = (expirationDate - selectedDate) / (1000 * 60 * 60 * 24);
                                                 //1000밀리초, 60초, 60분, 24시간 = 86,400,000 (날짜간의 차이를 계산할때 정확하게하기 위해)
          console.log("tt:" + daysDifference);
          return daysDifference >= -7 && daysDifference <= 1;
        });
        setStock(expiringProducts);
        console.log("Expiring Products:", expiringProducts);
        // console.log(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the stock!', error);
      });
  };


  const handleSelect = (gcode) => {
    setSelectedGoods(prevSelectedGoods =>
      prevSelectedGoods.includes(gcode)
        ? prevSelectedGoods.filter(gcode => gcode !== gcode)
        : [...prevSelectedGoods, gcode]
    );
  };
  const handleOrder = () => {
    const selectedItems = goods.filter(item => selectedGoods.includes(item.gcode));
    const orderCartDTOs = selectedItems.map(item => ({
        
        gcount: 1, // 필요에 따라 수정
        goods: {
            gcode: item.gcode,
            gcategory: item.gcategory,
            gname: item.gname,
            gcostprice: item.gcostprice,
            gimage: item.gimage,
            gcompany: item.gcompany,
            gunit: item.gunit,
        }
    }));
    axios.post('http://localhost:8090/traders/ordercart/saveAll', orderCartDTOs)
      .then(response => {
        console.log('Order placed successfully:', response);
        console.log('Response data:', response.data);
      })
      .catch(error => {
        console.error('There was an error placing the order!', error);
      });
};


  return (
    <div className={main.Main}>
      <div className={main.goods_page}>
        <div className={main.leftSection}>
          <form onSubmit={handleSearch} id='goods-form'>
            <input type='search'
              name='goods_search'
              placeholder='제품코드, 카테고리명, 상품명 검색'
              className={main.inputGoodsSearch}
              value={searchGoods}
              onChange={(e) => setSearchGoods(e.target.value)} />
            <button type="submit" className={main.btnGoodsSearch}>검색</button>
          </form>
          <div className={main.goodsList}>
            <table className={main.goodsTable}>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}><input type="checkbox" /></th>
                  <th style={{ width: '65px' }}>제품번호</th>
                  <th>제품코드</th>
                  <th>카테고리</th>
                  <th>상품명(단위)</th>
                  <th>가격</th>
                </tr>
              </thead>
              <tbody>
                {goods.map((goods, index) => (
                  <tr key={index} className={main.goodsItem}>
                    <td><input    type="checkbox"
                        checked={selectedGoods.includes(goods.gcode)}
                        onChange={() => handleSelect(goods.gcode)} /></td>
                    <td>{index + 1}</td>
                    <td>{goods.gcode}</td>
                    <td>{goods.gcategory}</td>
                    <td>{goods.gname}</td>
                    <td>{goods.gcostprice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className={main.orBtn} onClick={handleOrder}>발주하기</button>

          <div className={main.events}>
            이벤트 슬라이드
          </div>
        </div>
      </div>

      <div className={main.rightsection}>
        <div className={main.locCalender}>
          <Calendar onDateSelect={handleDateSelect} />
        </div>
        <div className={main.tableLabel}>
          <div className={main.tableLabel2}>유통기한 임박 상품 리스트</div>
          <div className={main.tableLabel3}>재고 부족 상품 리스트</div>
        </div>
        <div className={main.rightSectionBox}>
          <div className={main.disuseList}>
            <table className={main.disuseTable}>
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>번호</th>
                  <th style={{ width: '28%' }}>제품코드</th>
                  <th style={{ width: '35%' }}>상품명</th>
                  <th style={{ width: '25%' }}>유통기한</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((stock, index) => (
                  <tr key={index} className={main.stockItem}>
                    <td>{index + 1}</td>
                    <td>{stock.goods.gcode}</td>
                    <td>{stock.goods.gname}</td>
                    <td>{stock.expdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={main.stockList}>
            <table className={main.stockTable}>
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>번호</th>
                  <th style={{ width: '28%' }}>제품코드</th>
                  <th style={{ width: '35%' }}>상품명</th>
                  <th style={{ width: '12%' }}>수량</th>
                  {/* <th>단위</th> */}
                </tr>
              </thead>
              <tbody>
                {stockk.map((stock, index) => (
                  <tr key={index} className={main.stockItem}>
                    <td>{index + 1}</td>
                    <td>{stock.goods.gcode}</td>
                    <td>{stock.goods.gname}</td>
                    <td>{stock.stockquantity}</td>
                    {/* <td>{stock.gunit}</td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Main;

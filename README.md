# sonar-viewer

## 패킷 데이터 분석 (Python)

### 사용 방법

1. **CSV 파일을 `packetData/` 폴더에 넣기**

   ```bash
   cp your_file.csv packetData/
   ```

2. **분석 실행**

   Windows:
   ```bash
   python analyze_all_packets.py
   ```

   Mac/Linux:
   ```bash
   python3 analyze_all_packets.py
   ```

   또는
   ```bash
   ./analyze_all_packets.py
   ```

3. **결과 확인**
   - 터미널에서 결과 확인
   - `packetMdFiles/` 폴더에 마크다운 파일로 저장됨
